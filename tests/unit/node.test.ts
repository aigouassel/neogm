import { Node } from '../../src/lib/node';
import { ConnectionManager } from '../../src/lib/connection';
import { testConfig } from '../setup/test-config';

describe('Node', () => {
  let connectionManager: ConnectionManager;

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
  });

  describe('constructor', () => {
    it('should create a node with label and properties', () => {
      const node = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      
      expect(node.getLabel()).toBe('Person');
      expect(node.getProperties()).toEqual({ name: 'John', age: 30 });
      expect(node.getId()).toBeUndefined();
    });
  });

  describe('property management', () => {
    it('should set and get properties', () => {
      const node = new Node('Person', {}, connectionManager);
      
      node.setProperty('name', 'Alice');
      node.setProperty('age', 25);
      
      expect(node.getProperty('name')).toBe('Alice');
      expect(node.getProperty('age')).toBe(25);
      expect(node.getProperties()).toEqual({ name: 'Alice', age: 25 });
    });
  });

  describe('save', () => {
    it('should save a new node and assign ID', async () => {
      const node = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      
      await node.save();
      
      expect(node.getId()).toBeDefined();
      expect(typeof node.getId()).toBe('number');
    });

    it('should update existing node', async () => {
      const node = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      await node.save();
      
      const originalId = node.getId();
      node.setProperty('age', 31);
      await node.save();
      
      expect(node.getId()).toBe(originalId);
      expect(node.getProperty('age')).toBe(31);
    });
  });

  describe('delete', () => {
    it('should delete an existing node', async () => {
      const node = new Node('Person', { name: 'John' }, connectionManager);
      await node.save();
      
      const result = await node.delete();
      expect(result).toBe(true);
    });

    it('should throw error when trying to delete node without ID', async () => {
      const node = new Node('Person', { name: 'John' }, connectionManager);
      
      await expect(node.delete()).rejects.toThrow('Cannot delete node without ID');
    });
  });

  describe('findById', () => {
    it('should find node by ID', async () => {
      const originalNode = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      await originalNode.save();
      
      const foundNode = await Node.findById(originalNode.getId()!, 'Person', connectionManager);
      
      expect(foundNode).not.toBeNull();
      expect(foundNode!.getProperty('name')).toBe('John');
      expect(foundNode!.getProperty('age')).toBe(30);
    });

    it('should return null for non-existent ID', async () => {
      const foundNode = await Node.findById(99999, 'Person', connectionManager);
      expect(foundNode).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      const node1 = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      const node2 = new Node('Person', { name: 'Jane', age: 25 }, connectionManager);
      const node3 = new Node('Person', { name: 'Bob', age: 35 }, connectionManager);
      
      await Promise.all([node1.save(), node2.save(), node3.save()]);
    });

    it('should find all nodes with label', async () => {
      const nodes = await Node.findAll('Person', connectionManager);
      expect(nodes).toHaveLength(3);
    });

    it('should find nodes with where conditions', async () => {
      const nodes = await Node.findAll('Person', connectionManager, { where: { name: 'John' } });
      expect(nodes).toHaveLength(1);
      expect(nodes[0].getProperty('name')).toBe('John');
    });

    it('should apply limit option', async () => {
      const nodes = await Node.findAll('Person', connectionManager, { limit: 2 });
      expect(nodes).toHaveLength(2);
    });

    it('should apply skip option', async () => {
      const allNodes = await Node.findAll('Person', connectionManager);
      const skippedNodes = await Node.findAll('Person', connectionManager, { skip: 1 });
      expect(skippedNodes).toHaveLength(allNodes.length - 1);
    });
  });

  describe('findOne', () => {
    it('should find single node matching conditions', async () => {
      const originalNode = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      await originalNode.save();
      
      const foundNode = await Node.findOne('Person', { name: 'John' }, connectionManager);
      
      expect(foundNode).not.toBeNull();
      expect(foundNode!.getProperty('name')).toBe('John');
    });

    it('should return null when no match found', async () => {
      const foundNode = await Node.findOne('Person', { name: 'NonExistent' }, connectionManager);
      expect(foundNode).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should serialize node to JSON', async () => {
      const node = new Node('Person', { name: 'John', age: 30 }, connectionManager);
      await node.save();
      
      const json = node.toJSON();
      
      expect(json).toEqual({
        label: 'Person',
        properties: { name: 'John', age: 30 },
        id: node.getId()
      });
    });
  });
});