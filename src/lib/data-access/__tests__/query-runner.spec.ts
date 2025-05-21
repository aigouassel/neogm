/**
 * Tests for query runner using real Neo4j instance
 */

import { QueryRunner } from '../query-runner';
import { SessionManager } from '../session-manager';

describe('QueryRunner', () => {
  let queryRunner: QueryRunner;
  let sessionManager: SessionManager;
  
  beforeEach(async () => {
    // We don't reset the singleton instance since the Jest setup has already initialized it
    queryRunner = QueryRunner.getInstance();
    sessionManager = SessionManager.getInstance();
    
    // Clean database before each test
    await sessionManager.run('MATCH (n) DETACH DELETE n');
  });
  
  it('should be a singleton', () => {
    const instance1 = QueryRunner.getInstance();
    const instance2 = QueryRunner.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should run a query and return results', async () => {
    const results = await queryRunner.run<{ num: number }>('RETURN 42 as num');
    
    expect(results).toHaveLength(1);
    expect(results[0].num.toNumber()).toBe(42);
  });
  
  it('should run a query with parameters', async () => {
    const name = 'Alice';
    const age = 30;
    
    const results = await queryRunner.run(
      'CREATE (p:Person {name: $name, age: $age}) RETURN p',
      { name, age }
    );
    
    expect(results).toHaveLength(1);
    expect(results[0].p.properties.name).toBe(name);
    expect(results[0].p.properties.age.toNumber()).toBe(age);
  });
  
  it('should run a query and map results', async () => {
    // Create test data
    await sessionManager.run(`
      CREATE (a:Person {name: 'Alice', age: 30})
      CREATE (b:Person {name: 'Bob', age: 25})
      CREATE (c:Person {name: 'Charlie', age: 35})
    `);
    
    // Custom mapper function
    const mapper = (record: any) => {
      const person = record.get('p');
      return {
        name: person.properties.name,
        age: person.properties.age.toNumber()
      };
    };
    
    // Run query with mapper
    const results = await queryRunner.run<{ name: string, age: number }>(
      'MATCH (p:Person) RETURN p ORDER BY p.name',
      {},
      mapper
    );
    
    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('Alice');
    expect(results[0].age).toBe(30);
    expect(results[1].name).toBe('Bob');
    expect(results[1].age).toBe(25);
    expect(results[2].name).toBe('Charlie');
    expect(results[2].age).toBe(35);
  });
  
  it('should run a query that returns a single result', async () => {
    // Create test data
    await sessionManager.run(`
      CREATE (a:Person {name: 'Alice', age: 30})
    `);
    
    const result = await queryRunner.runOne<{ p: any }>(
      'MATCH (p:Person {name: $name}) RETURN p',
      { name: 'Alice' }
    );
    
    expect(result).not.toBeNull();
    expect(result?.p.properties.name).toBe('Alice');
    expect(result?.p.properties.age.toNumber()).toBe(30);
  });
  
  it('should return null for runOne when no results', async () => {
    const result = await queryRunner.runOne(
      'MATCH (p:Person {name: $name}) RETURN p',
      { name: 'NonExistent' }
    );
    
    expect(result).toBeNull();
  });
  
  it('should extract a specific field from results', async () => {
    // Create test data
    await sessionManager.run(`
      CREATE (a:Person {name: 'Alice', age: 30})
      CREATE (b:Person {name: 'Bob', age: 25})
    `);
    
    const names = await queryRunner.runAndGetField<string>(
      'MATCH (p:Person) RETURN p.name as name ORDER BY p.name',
      'name'
    );
    
    expect(names).toEqual(['Alice', 'Bob']);
  });
  
  it('should count records', async () => {
    // Create test data
    await sessionManager.run(`
      CREATE (a:Person {name: 'Alice', age: 30})
      CREATE (b:Person {name: 'Bob', age: 25})
      CREATE (c:Person {name: 'Charlie', age: 35})
    `);
    
    const count = await queryRunner.count(
      'MATCH (p:Person) RETURN count(p) as count'
    );
    
    expect(count).toBe(3);
  });
  
  it('should check if records exist', async () => {
    // Create test data
    await sessionManager.run(`
      CREATE (a:Person {name: 'Alice', age: 30})
    `);
    
    const exists = await queryRunner.exists(
      'MATCH (p:Person {name: $name}) RETURN p',
      { name: 'Alice' }
    );
    
    const notExists = await queryRunner.exists(
      'MATCH (p:Person {name: $name}) RETURN p',
      { name: 'NonExistent' }
    );
    
    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });
});