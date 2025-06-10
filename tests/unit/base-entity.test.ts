import { Node, Property } from '../../src/lib/decorators';
import { BaseEntity, Repository } from '../../src/lib/entity';
import { ConnectionManager } from '../../src/lib/connection';
import { NeoGM } from '../../src/lib/neogm';

// Test entities
@Node('TestPerson')
class TestPerson extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property()
  age?: number;

  @Property({ 
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Property({ 
    validator: (email: string) => email.includes('@')
  })
  email?: string;
}

describe('BaseEntity', () => {
  let neogm: NeoGM;
  let repository: Repository<TestPerson>;

  beforeAll(async () => {
    neogm = new NeoGM({
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'test',
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    await neogm.connect();
    repository = neogm.getRepository(TestPerson);
  });

  beforeEach(async () => {
    await neogm.clearDatabase();
  });

  afterAll(async () => {
    await neogm.disconnect();
  });

  describe('Entity creation and saving', () => {
    it('should create and save entity', async () => {
      const person = await repository.create({
        name: 'John Doe',
        age: 30,
        createdAt: new Date('2023-01-01'),
        email: 'john@example.com'
      });

      expect(person.name).toBe('John Doe');
      expect(person.age).toBe(30);
      expect(person.email).toBe('john@example.com');
      expect(person.getId()).toBeUndefined();

      await person.save();

      expect(person.getId()).toBeDefined();
      expect(person.isLoaded()).toBe(true);
    });

    it('should validate required properties', async () => {
      const person = await repository.create({
        age: 30
        // Missing required 'name' property
      });

      await expect(person.save()).rejects.toThrow("Property 'name' is required but not provided");
    });

    it('should validate custom validators', async () => {
      const person = await repository.create({
        name: 'John Doe',
        email: 'invalid-email' // Should fail validation
      });

      await expect(person.save()).rejects.toThrow("Property 'email' failed validation");
    });

    it('should apply transformers on save and load', async () => {
      const testDate = new Date('2023-01-01T12:00:00Z');
      const person = await repository.create({
        name: 'John Doe',
        createdAt: testDate
      });

      await person.save();

      // Reload from database
      const loaded = await repository.findById(person.getId()!);
      expect(loaded).toBeTruthy();
      expect(loaded!.createdAt).toBeInstanceOf(Date);
      expect(loaded!.createdAt!.getTime()).toBe(testDate.getTime());
    });
  });

  describe('Entity updates', () => {
    it('should update existing entity', async () => {
      const person = await repository.create({
        name: 'John Doe',
        age: 30
      });
      await person.save();

      person.age = 31;
      person.email = 'john.doe@example.com';
      await person.save();

      const updated = await repository.findById(person.getId()!);
      expect(updated!.age).toBe(31);
      expect(updated!.email).toBe('john.doe@example.com');
    });
  });

  describe('Entity deletion', () => {
    it('should delete entity', async () => {
      const person = await repository.create({
        name: 'John Doe',
        age: 30
      });
      await person.save();
      const id = person.getId()!;

      const deleted = await person.delete();
      expect(deleted).toBe(true);
      expect(person.getId()).toBeUndefined();
      expect(person.isLoaded()).toBe(false);

      const notFound = await repository.findById(id);
      expect(notFound).toBeNull();
    });

    it('should throw error when deleting entity without ID', async () => {
      const person = await repository.create({
        name: 'John Doe'
      });

      await expect(person.delete()).rejects.toThrow('Cannot delete entity without ID');
    });
  });

  describe('Entity reload', () => {
    it('should reload entity from database', async () => {
      const person = await repository.create({
        name: 'John Doe',
        age: 30
      });
      await person.save();

      // Modify in memory
      person.age = 999;

      // Reload from database
      await person.reload();
      expect(person.age).toBe(30); // Should be original value
    });

    it('should throw error when reloading entity without ID', async () => {
      const person = await repository.create({
        name: 'John Doe'
      });

      await expect(person.reload()).rejects.toThrow('Cannot reload entity without ID');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize entity to JSON', async () => {
      const person = await repository.create({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      });
      await person.save();

      const json = person.toJSON();
      expect(json).toEqual({
        id: person.getId(),
        label: 'TestPerson',
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        createdAt: undefined
      });
    });
  });
});