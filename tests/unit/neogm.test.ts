import 'reflect-metadata';
import { NeoGM } from '../../src/lib/neogm';
import { testConfig } from '../setup/test-config';
import { Node, Property, BaseEntity } from '../../src';

@Node('TestUser')
class TestUser extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property({ required: true })
  email!: string;

  @Property()
  age?: number;
}

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

  describe('repository operations', () => {
    beforeEach(async () => {
      await neogm.connect();
      await neogm.clearDatabase();
    });

    it('should get repository for entity', () => {
      const userRepo = neogm.getRepository(TestUser);
      expect(userRepo).toBeDefined();
    });

    it('should reuse same repository instance', () => {
      const userRepo1 = neogm.getRepository(TestUser);
      const userRepo2 = neogm.getRepository(TestUser);
      expect(userRepo1).toBe(userRepo2);
    });
  });

  describe('entity operations', () => {
    beforeEach(async () => {
      await neogm.connect();
      await neogm.clearDatabase();
    });

    it('should create entity with connection manager', () => {
      const user = neogm.createEntity(TestUser);
      expect(user).toBeInstanceOf(TestUser);
    });

    it('should create entity with initial data', () => {
      const user = neogm.createEntity(TestUser, {
        name: 'John',
        email: 'john@example.com',
        age: 30
      });
      
      expect(user.name).toBe('John');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
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
      
      // Small delay to ensure data is committed
      await new Promise(resolve => setTimeout(resolve, 10));
      
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
      const userRepo = neogm.getRepository(TestUser);
      
      const user1 = neogm.createEntity(TestUser, { name: 'John', email: 'john@example.com', age: 30 });
      const user2 = neogm.createEntity(TestUser, { name: 'Jane', email: 'jane@example.com', age: 25 });
      
      await userRepo.save(user1);
      await userRepo.save(user2);
      
      await neogm.clearDatabase();
      
      const users = await userRepo.find();
      expect(users).toHaveLength(0);
    });
  });
});