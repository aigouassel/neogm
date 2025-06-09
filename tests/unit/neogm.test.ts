import { NeoGM } from '../../src/lib/neogm';
import { testConfig } from '../setup/test-config';

describe('NeoGM', () => {
  let neogm: NeoGM;

  beforeEach(() => {
    neogm = new NeoGM(testConfig);
  });

  afterEach(async () => {
    if (neogm.isConnected()) {
      await neogm.disconnect();
    }
  });

  describe('connection management', () => {
    it('should connect and disconnect successfully', async () => {
      await neogm.connect();
      expect(neogm.isConnected()).toBe(true);
      
      await neogm.disconnect();
      expect(neogm.isConnected()).toBe(false);
    });
  });

  describe('node operations', () => {
    beforeEach(async () => {
      await neogm.connect();
      await neogm.clearDatabase();
    });

    it('should create and save nodes', async () => {
      const node = neogm.createNode('Person', { name: 'John', age: 30 });
      await node.save();
      
      expect(node.getId()).toBeDefined();
      expect(node.getProperty('name')).toBe('John');
    });

    it('should find nodes by ID', async () => {
      const node = neogm.createNode('Person', { name: 'John' });
      await node.save();
      
      const foundNode = await neogm.findNodeById(node.getId()!, 'Person');
      expect(foundNode).not.toBeNull();
      expect(foundNode!.getProperty('name')).toBe('John');
    });

    it('should find all nodes', async () => {
      const node1 = neogm.createNode('Person', { name: 'John' });
      const node2 = neogm.createNode('Person', { name: 'Jane' });
      await Promise.all([node1.save(), node2.save()]);
      
      const nodes = await neogm.findNodes('Person');
      expect(nodes).toHaveLength(2);
    });

    it('should find nodes with conditions', async () => {
      const node1 = neogm.createNode('Person', { name: 'John', age: 30 });
      const node2 = neogm.createNode('Person', { name: 'Jane', age: 25 });
      await Promise.all([node1.save(), node2.save()]);
      
      const nodes = await neogm.findNodes('Person', { age: 30 });
      expect(nodes).toHaveLength(1);
      expect(nodes[0].getProperty('name')).toBe('John');
    });

    it('should find one node', async () => {
      const node = neogm.createNode('Person', { name: 'John', age: 30 });
      await node.save();
      
      const foundNode = await neogm.findOneNode('Person', { name: 'John' });
      expect(foundNode).not.toBeNull();
      expect(foundNode!.getProperty('age')).toBe(30);
    });
  });

  describe('relationship operations', () => {
    let startNode: any;
    let endNode: any;

    beforeEach(async () => {
      await neogm.connect();
      await neogm.clearDatabase();
      
      startNode = neogm.createNode('Person', { name: 'Alice' });
      endNode = neogm.createNode('Person', { name: 'Bob' });
      await Promise.all([startNode.save(), endNode.save()]);
    });

    it('should create and save relationships', async () => {
      const relationship = neogm.createRelationship('KNOWS', startNode, endNode, { since: 2020 });
      await relationship.save();
      
      expect(relationship.getId()).toBeDefined();
      expect(relationship.getProperty('since')).toBe(2020);
    });

    it('should find relationships by ID', async () => {
      const relationship = neogm.createRelationship('KNOWS', startNode, endNode, { since: 2020 });
      await relationship.save();
      
      const foundRel = await neogm.findRelationshipById(relationship.getId()!, 'KNOWS');
      expect(foundRel).not.toBeNull();
      expect(foundRel!.getProperty('since')).toBe(2020);
    });

    it('should find all relationships', async () => {
      const rel1 = neogm.createRelationship('KNOWS', startNode, endNode, { type: 'friend' });
      const rel2 = neogm.createRelationship('KNOWS', endNode, startNode, { type: 'colleague' });
      await Promise.all([rel1.save(), rel2.save()]);
      
      const relationships = await neogm.findRelationships('KNOWS');
      expect(relationships).toHaveLength(2);
    });

    it('should find relationships between nodes', async () => {
      const rel1 = neogm.createRelationship('KNOWS', startNode, endNode, { type: 'friend' });
      const rel2 = neogm.createRelationship('WORKS_WITH', startNode, endNode, { department: 'IT' });
      await Promise.all([rel1.save(), rel2.save()]);
      
      const knowsRels = await neogm.findRelationshipsBetweenNodes(
        startNode.getId()!,
        endNode.getId()!,
        'KNOWS'
      );
      
      expect(knowsRels).toHaveLength(1);
      expect(knowsRels[0].getProperty('type')).toBe('friend');
    });
  });

  describe('query operations', () => {
    beforeEach(async () => {
      await neogm.connect();
      await neogm.clearDatabase();
    });

    it('should provide query builder', () => {
      const qb = neogm.queryBuilder();
      expect(qb).toBeDefined();
      
      const query = qb.match('(n:Person)').return('n').build();
      expect(query).toBe('MATCH (n:Person) RETURN n');
    });

    it('should provide raw query interface', async () => {
      const rawQuery = neogm.rawQuery();
      expect(rawQuery).toBeDefined();
      
      await rawQuery.execute('CREATE (n:Person {name: $name})', { name: 'Test' });
      const result = await rawQuery.execute('MATCH (n:Person) RETURN count(n) as count');
      expect(result.records[0].count).toBe(1);
    });
  });

  describe('transaction operations', () => {
    beforeEach(async () => {
      await neogm.connect();
      await neogm.clearDatabase();
    });

    it('should execute write transaction', async () => {
      const result = await neogm.executeInTransaction(async (tx) => {
        await tx.run('CREATE (n:Person {name: $name})', { name: 'John' });
        const countResult = await tx.run('MATCH (n:Person) RETURN count(n) as count');
        return countResult.records[0].get('count').toNumber();
      });
      
      expect(result).toBe(1);
    });

    it('should execute read transaction', async () => {
      await neogm.rawQuery().execute('CREATE (n:Person {name: $name})', { name: 'John' });
      
      const result = await neogm.executeReadTransaction(async (tx) => {
        const countResult = await tx.run('MATCH (n:Person) RETURN count(n) as count');
        return countResult.records[0].get('count').toNumber();
      });
      
      expect(result).toBe(1);
    });

    it('should rollback failed transaction', async () => {
      await expect(neogm.executeInTransaction(async (tx) => {
        await tx.run('CREATE (n:Person {name: $name})', { name: 'John' });
        throw new Error('Transaction failed');
      })).rejects.toThrow('Transaction failed');
      
      const count = await neogm.executeReadTransaction(async (tx) => {
        const result = await tx.run('MATCH (n:Person) RETURN count(n) as count');
        return result.records[0].get('count').toNumber();
      });
      
      expect(count).toBe(0);
    });
  });

  describe('clearDatabase', () => {
    beforeEach(async () => {
      await neogm.connect();
    });

    it('should clear all nodes and relationships', async () => {
      const node1 = neogm.createNode('Person', { name: 'John' });
      const node2 = neogm.createNode('Person', { name: 'Jane' });
      await Promise.all([node1.save(), node2.save()]);
      
      const rel = neogm.createRelationship('KNOWS', node1, node2);
      await rel.save();
      
      await neogm.clearDatabase();
      
      const nodes = await neogm.findNodes('Person');
      const relationships = await neogm.findRelationships('KNOWS');
      
      expect(nodes).toHaveLength(0);
      expect(relationships).toHaveLength(0);
    });
  });
});