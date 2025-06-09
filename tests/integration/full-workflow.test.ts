import { NeoGM } from '../../src/lib/neogm';
import { testConfig } from '../setup/test-config';

describe('Full Workflow Integration Tests', () => {
  let neogm: NeoGM;

  beforeAll(async () => {
    neogm = new NeoGM(testConfig);
    await neogm.connect();
  });

  afterAll(async () => {
    await neogm.disconnect();
  });

  beforeEach(async () => {
    await neogm.clearDatabase();
  });

  describe('Social Network Scenario', () => {
    it('should create a complete social network with nodes and relationships', async () => {
      const alice = neogm.createNode('Person', { 
        name: 'Alice', 
        age: 30, 
        email: 'alice@example.com',
        location: 'New York'
      });
      
      const bob = neogm.createNode('Person', { 
        name: 'Bob', 
        age: 25, 
        email: 'bob@example.com',
        location: 'San Francisco'
      });
      
      const charlie = neogm.createNode('Person', { 
        name: 'Charlie', 
        age: 35, 
        email: 'charlie@example.com',
        location: 'London'
      });

      const company = neogm.createNode('Company', {
        name: 'TechCorp',
        industry: 'Technology',
        founded: 2010
      });

      await Promise.all([alice.save(), bob.save(), charlie.save(), company.save()]);

      const friendship1 = neogm.createRelationship('KNOWS', alice, bob, { 
        since: 2018, 
        type: 'friend',
        strength: 'strong'
      });
      
      const friendship2 = neogm.createRelationship('KNOWS', bob, charlie, { 
        since: 2020, 
        type: 'colleague',
        strength: 'medium'
      });

      const employment1 = neogm.createRelationship('WORKS_FOR', alice, company, {
        position: 'Software Engineer',
        startDate: '2019-01-15',
        salary: 120000
      });

      const employment2 = neogm.createRelationship('WORKS_FOR', bob, company, {
        position: 'Product Manager',
        startDate: '2020-03-01',
        salary: 130000
      });

      await Promise.all([friendship1.save(), friendship2.save(), employment1.save(), employment2.save()]);

      const allPeople = await neogm.findNodes('Person');
      expect(allPeople).toHaveLength(3);

      const allCompanies = await neogm.findNodes('Company');
      expect(allCompanies).toHaveLength(1);

      const friendships = await neogm.findRelationships('KNOWS');
      expect(friendships).toHaveLength(2);

      const employments = await neogm.findRelationships('WORKS_FOR');
      expect(employments).toHaveLength(2);

      const techCorpEmployees = await neogm.queryBuilder()
        .match('(p:Person)-[:WORKS_FOR]->(c:Company)')
        .where({ 'c.name': 'TechCorp' })
        .return('p.name as name, p.email as email')
        .execute();

      expect(techCorpEmployees.records).toHaveLength(2);
      const names = techCorpEmployees.records.map(r => r.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');

      const mutualConnections = await neogm.queryBuilder()
        .match('(a:Person)-[:KNOWS]-(b:Person)-[:KNOWS]-(c:Person)')
        .where({ 'a.name': 'Alice', 'c.name': 'Charlie' })
        .return('b.name as connector')
        .execute();

      expect(mutualConnections.records).toHaveLength(1);
      expect(mutualConnections.records[0].connector).toBe('Bob');
    });
  });

  describe('Transaction Handling', () => {
    it('should handle complex transactions with rollback on failure', async () => {
      const initialCount = await neogm.executeReadTransaction(async (tx) => {
        const result = await tx.run('MATCH (n) RETURN count(n) as count');
        return result.records[0].get('count').toNumber();
      });

      expect(initialCount).toBe(0);

      await expect(neogm.executeInTransaction(async (tx) => {
        await tx.run('CREATE (p1:Person {name: $name1})', { name1: 'Alice' });
        await tx.run('CREATE (p2:Person {name: $name2})', { name2: 'Bob' });
        await tx.run('CREATE (c:Company {name: $name})', { name: 'TechCorp' });
        
        throw new Error('Simulated failure');
      })).rejects.toThrow('Simulated failure');

      const finalCount = await neogm.executeReadTransaction(async (tx) => {
        const result = await tx.run('MATCH (n) RETURN count(n) as count');
        return result.records[0].get('count').toNumber();
      });

      expect(finalCount).toBe(0);
    });

    it('should successfully commit complex transaction', async () => {
      const result = await neogm.executeInTransaction(async (tx) => {
        await tx.run('CREATE (p1:Person {name: $name1, age: $age1})', { name1: 'Alice', age1: 30 });
        await tx.run('CREATE (p2:Person {name: $name2, age: $age2})', { name2: 'Bob', age2: 25 });
        
        const relationshipResult = await tx.run(`
          MATCH (a:Person {name: $name1}), (b:Person {name: $name2})
          CREATE (a)-[r:KNOWS {since: $since}]->(b)
          RETURN r
        `, { name1: 'Alice', name2: 'Bob', since: 2020 });

        return relationshipResult.records.length;
      });

      expect(result).toBe(1);

      const people = await neogm.findNodes('Person');
      expect(people).toHaveLength(2);

      const relationships = await neogm.findRelationships('KNOWS');
      expect(relationships).toHaveLength(1);
    });
  });

  describe('Complex Query Scenarios', () => {
    beforeEach(async () => {
      const people = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'San Francisco' },
        { name: 'Charlie', age: 35, city: 'London' },
        { name: 'Diana', age: 28, city: 'New York' },
        { name: 'Eve', age: 32, city: 'San Francisco' }
      ];

      for (const person of people) {
        const node = neogm.createNode('Person', person);
        await node.save();
      }

      const alice = await neogm.findOneNode('Person', { name: 'Alice' });
      const bob = await neogm.findOneNode('Person', { name: 'Bob' });
      const charlie = await neogm.findOneNode('Person', { name: 'Charlie' });
      const diana = await neogm.findOneNode('Person', { name: 'Diana' });

      const relationships = [
        { start: alice!, end: bob!, type: 'KNOWS', props: { since: 2018 } },
        { start: bob!, end: charlie!, type: 'KNOWS', props: { since: 2019 } },
        { start: alice!, end: diana!, type: 'KNOWS', props: { since: 2020 } },
        { start: charlie!, end: diana!, type: 'KNOWS', props: { since: 2021 } }
      ];

      for (const rel of relationships) {
        const relationship = neogm.createRelationship(rel.type, rel.start, rel.end, rel.props);
        await relationship.save();
      }
    });

    it('should find people by age range', async () => {
      const result = await neogm.rawQuery().execute(`
        MATCH (p:Person)
        WHERE p.age >= $minAge AND p.age <= $maxAge
        RETURN p.name as name, p.age as age
        ORDER BY p.age
      `, { minAge: 25, maxAge: 30 });

      expect(result.records).toHaveLength(3);
      expect(result.records[0].name).toBe('Bob');
      expect(result.records[1].name).toBe('Diana');
      expect(result.records[2].name).toBe('Alice');
    });

    it('should find people with most connections', async () => {
      const result = await neogm.rawQuery().execute(`
        MATCH (p:Person)-[r:KNOWS]-()
        RETURN p.name as name, count(r) as connections
        ORDER BY connections DESC
        LIMIT 2
      `);

      expect(result.records).toHaveLength(2);
      expect(result.records[0].connections).toBe(2);
    });

    it('should find shortest path between people', async () => {
      const result = await neogm.rawQuery().execute(`
        MATCH path = shortestPath((a:Person {name: $start})-[:KNOWS*]-(b:Person {name: $end}))
        RETURN length(path) as pathLength, [n in nodes(path) | n.name] as names
      `, { start: 'Alice', end: 'Charlie' });

      expect(result.records).toHaveLength(1);
      expect(result.records[0].pathLength).toBe(2);
      expect(result.records[0].names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should group people by city and count', async () => {
      const result = await neogm.rawQuery().execute(`
        MATCH (p:Person)
        RETURN p.city as city, count(p) as count, collect(p.name) as people
        ORDER BY count DESC
      `);

      expect(result.records).toHaveLength(3);
      
      const nycRecord = result.records.find(r => r.city === 'New York');
      expect(nycRecord?.count).toBe(2);
      expect(nycRecord?.people).toContain('Alice');
      expect(nycRecord?.people).toContain('Diana');
    });
  });

  describe('Performance and Pagination', () => {
    beforeEach(async () => {
      const batchSize = 10;
      for (let i = 0; i < batchSize; i++) {
        const node = neogm.createNode('TestNode', { 
          index: i, 
          name: `Node${i}`, 
          category: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'
        });
        await node.save();
      }
    });

    it('should handle pagination correctly', async () => {
      const firstPage = await neogm.findNodes('TestNode', undefined, { 
        limit: 3, 
        skip: 0, 
        orderBy: 'index' 
      });
      
      const secondPage = await neogm.findNodes('TestNode', undefined, { 
        limit: 3, 
        skip: 3, 
        orderBy: 'index' 
      });

      expect(firstPage).toHaveLength(3);
      expect(secondPage).toHaveLength(3);
      
      expect(firstPage[0].getProperty('index')).toBe(0);
      expect(firstPage[2].getProperty('index')).toBe(2);
      expect(secondPage[0].getProperty('index')).toBe(3);
      expect(secondPage[2].getProperty('index')).toBe(5);
    });

    it('should filter and paginate simultaneously', async () => {
      const categoryANodes = await neogm.findNodes('TestNode', { category: 'A' }, {
        limit: 2,
        orderBy: 'index'
      });

      expect(categoryANodes).toHaveLength(2);
      expect(categoryANodes.every(node => node.getProperty('category') === 'A')).toBe(true);
    });
  });
});