import { QueryBuilder, RawQuery } from '../../src/lib/query-builder';
import { ConnectionManager } from '../../src/lib/connection';
import { testConfig } from '../setup/test-config';
import { TestIsolation } from '../setup/test-isolation';

describe('QueryBuilder', () => {
  let connectionManager: ConnectionManager;
  let queryBuilder: QueryBuilder;

  beforeAll(async () => {
    connectionManager = new ConnectionManager(testConfig);
    await connectionManager.connect();
  });

  afterAll(async () => {
    await connectionManager.disconnect();
  });

  beforeEach(async () => {
    await TestIsolation.ensureCleanDatabase(connectionManager);
    queryBuilder = QueryBuilder.create(connectionManager);
  });

  describe('build', () => {
    it('should build simple MATCH query', () => {
      const query = queryBuilder
        .match('(n:Person)')
        .return('n')
        .build();
      
      expect(query).toBe('MATCH (n:Person) RETURN n');
    });

    it('should build query with WHERE clause', () => {
      const query = queryBuilder
        .match('(n:Person)')
        .where({ 'n.name': 'John' })
        .return('n')
        .build();
      
      expect(query).toBe('MATCH (n:Person) WHERE n.name = $param_0 RETURN n');
    });

    it('should build query with multiple WHERE conditions', () => {
      const query = queryBuilder
        .match('(n:Person)')
        .where({ 'n.name': 'John', 'n.age': 30 })
        .return('n')
        .build();
      
      expect(query).toBe('MATCH (n:Person) WHERE n.name = $param_0 AND n.age = $param_1 RETURN n');
    });

    it('should build query with ORDER BY', () => {
      const query = queryBuilder
        .match('(n:Person)')
        .return('n')
        .orderBy('n.name', 'ASC')
        .build();
      
      expect(query).toBe('MATCH (n:Person) RETURN n ORDER BY n.name ASC');
    });

    it('should build query with LIMIT and SKIP', () => {
      const query = queryBuilder
        .match('(n:Person)')
        .return('n')
        .skip(10)
        .limit(5)
        .build();
      
      expect(query).toBe('MATCH (n:Person) RETURN n SKIP 10 LIMIT 5');
    });

    it('should build complex query with all clauses', () => {
      const query = queryBuilder
        .match('(n:Person)')
        .where({ 'n.age': 30 })
        .return('n.name, n.age')
        .orderBy('n.name', 'DESC')
        .skip(5)
        .limit(10)
        .build();
      
      expect(query).toBe('MATCH (n:Person) WHERE n.age = $param_0 RETURN n.name, n.age ORDER BY n.name DESC SKIP 5 LIMIT 10');
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      const rawQuery = new RawQuery(connectionManager);
      await rawQuery.execute('CREATE (n:Person {name: $name, age: $age})', { name: 'Alice', age: 30 });
      await rawQuery.execute('CREATE (n:Person {name: $name, age: $age})', { name: 'Bob', age: 25 });
      await rawQuery.execute('CREATE (n:Person {name: $name, age: $age})', { name: 'Charlie', age: 35 });
    });

    it('should execute query and return results', async () => {
      const result = await queryBuilder
        .match('(n:Person)')
        .return('n')
        .execute();
      
      expect(result.records).toHaveLength(3);
      expect(result.summary).toBeDefined();
    });

    it('should execute query with parameters', async () => {
      const result = await queryBuilder
        .match('(n:Person)')
        .where({ 'n.name': 'Alice' })
        .return('n')
        .execute();
      
      expect(result.records).toHaveLength(1);
      expect(result.records[0].n.name).toBe('Alice');
    });

    it('should apply limit correctly', async () => {
      const result = await queryBuilder
        .match('(n:Person)')
        .return('n')
        .limit(2)
        .execute();
      
      expect(result.records).toHaveLength(2);
    });
  });
});

describe('RawQuery', () => {
  let connectionManager: ConnectionManager;
  let rawQuery: RawQuery;

  beforeAll(async () => {
    connectionManager = new ConnectionManager(testConfig);
    await connectionManager.connect();
  });

  afterAll(async () => {
    await connectionManager.disconnect();
  });

  beforeEach(async () => {
    const session = connectionManager.getSession();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
    
    rawQuery = new RawQuery(connectionManager);
  });

  describe('execute', () => {
    it('should execute raw query', async () => {
      await rawQuery.execute('CREATE (n:Person {name: $name, age: $age})', { name: 'John', age: 30 });
      
      const result = await rawQuery.execute('MATCH (n:Person) RETURN n');
      expect(result.records).toHaveLength(1);
      expect(result.records[0].n.name).toBe('John');
    });

    it('should handle queries without parameters', async () => {
      const result = await rawQuery.execute('MATCH (n) RETURN count(n) as count');
      expect(result.records).toHaveLength(1);
      expect(result.records[0].count).toBe(0);
    });
  });

  describe('executeInTransaction', () => {
    it('should execute multiple queries in transaction', async () => {
      const queries = [
        { query: 'CREATE (n:Person {name: $name1})', parameters: { name1: 'Alice' } },
        { query: 'CREATE (n:Person {name: $name2})', parameters: { name2: 'Bob' } }
      ];

      const results = await rawQuery.executeInTransaction(queries);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
      
      const countResult = await rawQuery.execute('MATCH (n:Person) RETURN count(n) as count');
      expect(countResult.records[0].count).toBe(2);
    });

    it('should rollback transaction on error', async () => {
      const queries = [
        { query: 'CREATE (n:Person {name: $name})', parameters: { name: 'Alice' } },
        { query: 'INVALID CYPHER QUERY' }
      ];

      await expect(rawQuery.executeInTransaction(queries)).rejects.toThrow();
      
      const countResult = await rawQuery.execute('MATCH (n:Person) RETURN count(n) as count');
      expect(countResult.records[0].count).toBe(0);
    });

    it('should work with callback function', async () => {
      const queries = [
        { query: 'CREATE (n:Person {name: $name})', parameters: { name: 'Alice' } }
      ];

      const result = await rawQuery.executeInTransaction(queries, (results) => {
        return results.length;
      });

      expect(result).toBe(1);
    });
  });
});