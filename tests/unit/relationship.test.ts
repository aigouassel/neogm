import { Node } from '../../src/lib/node';
import { Relationship } from '../../src/lib/relationship';
import { ConnectionManager } from '../../src/lib/connection';
import { testConfig } from '../setup/test-config';

describe('Relationship', () => {
  let connectionManager: ConnectionManager;
  let startNode: Node;
  let endNode: Node;

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

    startNode = new Node('Person', { name: 'Alice' }, connectionManager);
    endNode = new Node('Person', { name: 'Bob' }, connectionManager);
    await startNode.save();
    await endNode.save();
  });

  describe('constructor', () => {
    it('should create a relationship with type and properties', () => {
      const relationship = new Relationship('KNOWS', startNode, endNode, { since: 2020 }, connectionManager);
      
      expect(relationship.getType()).toBe('KNOWS');
      expect(relationship.getProperties()).toEqual({ since: 2020 });
      expect(relationship.getStartNode()).toBe(startNode);
      expect(relationship.getEndNode()).toBe(endNode);
      expect(relationship.getId()).toBeUndefined();
    });
  });

  describe('property management', () => {
    it('should set and get properties', () => {
      const relationship = new Relationship('KNOWS', startNode, endNode, {}, connectionManager);
      
      relationship.setProperty('since', 2020);
      relationship.setProperty('strength', 'strong');
      
      expect(relationship.getProperty('since')).toBe(2020);
      expect(relationship.getProperty('strength')).toBe('strong');
      expect(relationship.getProperties()).toEqual({ since: 2020, strength: 'strong' });
    });
  });

  describe('save', () => {
    it('should save a new relationship and assign ID', async () => {
      const relationship = new Relationship('KNOWS', startNode, endNode, { since: 2020 }, connectionManager);
      
      await relationship.save();
      
      expect(relationship.getId()).toBeDefined();
      expect(typeof relationship.getId()).toBe('number');
    });

    it('should update existing relationship', async () => {
      const relationship = new Relationship('KNOWS', startNode, endNode, { since: 2020 }, connectionManager);
      await relationship.save();
      
      const originalId = relationship.getId();
      relationship.setProperty('since', 2021);
      await relationship.save();
      
      expect(relationship.getId()).toBe(originalId);
      expect(relationship.getProperty('since')).toBe(2021);
    });

    it('should throw error when nodes are not saved', async () => {
      const unsavedNode = new Node('Person', { name: 'Charlie' }, connectionManager);
      const relationship = new Relationship('KNOWS', startNode, unsavedNode, {}, connectionManager);
      
      await expect(relationship.save()).rejects.toThrow('Both start and end nodes must be saved');
    });
  });

  describe('delete', () => {
    it('should delete an existing relationship', async () => {
      // Ensure nodes are saved again after database clear
      await startNode.save();
      await endNode.save();
      
      const relationship = new Relationship('KNOWS', startNode, endNode, {}, connectionManager);
      await relationship.save();
      
      expect(relationship.getId()).toBeDefined(); // Ensure it has an ID
      
      const result = await relationship.delete();
      expect(result).toBe(true);
    });

    it('should throw error when trying to delete relationship without ID', async () => {
      const relationship = new Relationship('KNOWS', startNode, endNode, {}, connectionManager);
      
      await expect(relationship.delete()).rejects.toThrow('Cannot delete relationship without ID');
    });
  });

  describe('findById', () => {
    it('should find relationship by ID', async () => {
      // Ensure nodes are saved again after database clear
      await startNode.save();
      await endNode.save();
      
      const originalRel = new Relationship('KNOWS', startNode, endNode, { since: 2020 }, connectionManager);
      await originalRel.save();
      
      const foundRel = await Relationship.findById(originalRel.getId()!, 'KNOWS', connectionManager);
      
      expect(foundRel).not.toBeNull();
      expect(foundRel!.getProperty('since')).toBe(2020);
      expect(foundRel!.getStartNode().getProperty('name')).toBe('Alice');
      expect(foundRel!.getEndNode().getProperty('name')).toBe('Bob');
    });

    it('should return null for non-existent ID', async () => {
      const foundRel = await Relationship.findById(99999, 'KNOWS', connectionManager);
      expect(foundRel).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Ensure main nodes are saved again after database clear
      await startNode.save();
      await endNode.save();
      
      const node3 = new Node('Person', { name: 'Charlie' }, connectionManager);
      await node3.save();

      const rel1 = new Relationship('KNOWS', startNode, endNode, { since: 2020 }, connectionManager);
      const rel2 = new Relationship('KNOWS', startNode, node3, { since: 2021 }, connectionManager);
      const rel3 = new Relationship('WORKS_WITH', endNode, node3, { department: 'IT' }, connectionManager);
      
      await Promise.all([rel1.save(), rel2.save(), rel3.save()]);
    });

    it('should find all relationships with type', async () => {
      const relationships = await Relationship.findAll('KNOWS', connectionManager);
      expect(relationships).toHaveLength(2);
    });

    it('should find relationships with where conditions', async () => {
      const relationships = await Relationship.findAll('KNOWS', connectionManager, { where: { since: 2020 } });
      expect(relationships).toHaveLength(1);
      expect(relationships[0].getProperty('since')).toBe(2020);
    });

    it('should apply limit option', async () => {
      const relationships = await Relationship.findAll('KNOWS', connectionManager, { limit: 1 });
      expect(relationships).toHaveLength(1);
    });
  });

  describe('findBetweenNodes', () => {
    it('should find relationships between specific nodes', async () => {
      // Ensure nodes are saved again after database clear
      await startNode.save();
      await endNode.save();
      
      const rel1 = new Relationship('KNOWS', startNode, endNode, { type: 'friend' }, connectionManager);
      const rel2 = new Relationship('WORKS_WITH', startNode, endNode, { department: 'IT' }, connectionManager);
      await Promise.all([rel1.save(), rel2.save()]);
      
      const knowsRels = await Relationship.findBetweenNodes(
        startNode.getId()!,
        endNode.getId()!,
        'KNOWS',
        connectionManager
      );
      
      expect(knowsRels).toHaveLength(1);
      expect(knowsRels[0].getProperty('type')).toBe('friend');
    });

    it('should return empty array when no relationships exist', async () => {
      // Ensure nodes are saved again after database clear
      await startNode.save();
      
      const node3 = new Node('Person', { name: 'Charlie' }, connectionManager);
      await node3.save();
      
      const relationships = await Relationship.findBetweenNodes(
        startNode.getId()!,
        node3.getId()!,
        'KNOWS',
        connectionManager
      );
      
      expect(relationships).toHaveLength(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize relationship to JSON', async () => {
      // Ensure nodes are saved again after database clear
      await startNode.save();
      await endNode.save();
      
      const relationship = new Relationship('KNOWS', startNode, endNode, { since: 2020 }, connectionManager);
      await relationship.save();
      
      const json = relationship.toJSON();
      
      expect(json).toEqual({
        type: 'KNOWS',
        properties: { since: 2020 },
        startNode: startNode.toJSON(),
        endNode: endNode.toJSON(),
        id: relationship.getId()
      });
    });
  });
});