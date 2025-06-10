import { Node, Property } from '../../src/lib/decorators';
import { BaseEntity, Repository } from '../../src/lib/entity';
import { NeoGM } from '../../src/lib/neogm';

@Node('RepositoryTestEntity')
class RepositoryTestEntity extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property()
  category?: string;

  @Property()
  score?: number;
}

describe('Repository', () => {
  let neogm: NeoGM;
  let repository: Repository<RepositoryTestEntity>;

  beforeAll(async () => {
    neogm = new NeoGM({
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'test',
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    await neogm.connect();
    repository = neogm.getRepository(RepositoryTestEntity);
  });

  beforeEach(async () => {
    await neogm.clearDatabase();
  });

  afterAll(async () => {
    await neogm.disconnect();
  });

  describe('Entity creation', () => {
    it('should create entity instance', async () => {
      const entity = await repository.create({
        name: 'Test Entity',
        category: 'test',
        score: 85
      });

      expect(entity).toBeInstanceOf(RepositoryTestEntity);
      expect(entity.name).toBe('Test Entity');
      expect(entity.category).toBe('test');
      expect(entity.score).toBe(85);
      expect(entity.getId()).toBeUndefined();
    });
  });

  describe('Finding entities', () => {
    beforeEach(async () => {
      // Create test data
      const entities = [
        { name: 'Entity A', category: 'alpha', score: 90 },
        { name: 'Entity B', category: 'beta', score: 85 },
        { name: 'Entity C', category: 'alpha', score: 95 },
        { name: 'Entity D', category: 'gamma', score: 80 }
      ];

      for (const data of entities) {
        const entity = await repository.create(data);
        await entity.save();
      }
    });

    it('should find entity by ID', async () => {
      const entities = await repository.find();
      const firstEntity = entities[0];

      const found = await repository.findById(firstEntity.getId()!);
      expect(found).toBeTruthy();
      expect(found!.name).toBe(firstEntity.name);
      expect(found!.getId()).toBe(firstEntity.getId());
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById(999999);
      expect(found).toBeNull();
    });

    it('should find all entities', async () => {
      const entities = await repository.find();
      expect(entities).toHaveLength(4);
      expect(entities.every(e => e instanceof RepositoryTestEntity)).toBe(true);
    });

    it('should find entities with where conditions', async () => {
      const alphaEntities = await repository.find({ where: { category: 'alpha' } });
      expect(alphaEntities).toHaveLength(2);
      expect(alphaEntities.every(e => e.category === 'alpha')).toBe(true);
    });

    it('should find entities with limit', async () => {
      const limitedEntities = await repository.find({ limit: 2 });
      expect(limitedEntities).toHaveLength(2);
    });

    it('should find entities with skip', async () => {
      const allEntities = await repository.find();
      const skippedEntities = await repository.find({ skip: 2 });
      expect(skippedEntities).toHaveLength(2);
      expect(skippedEntities[0].getId()).toBe(allEntities[2].getId());
    });

    it('should find entities with orderBy', async () => {
      const orderedEntities = await repository.find({ orderBy: 'score' });
      expect(orderedEntities).toHaveLength(4);
      expect(orderedEntities[0].score).toBe(80);
      expect(orderedEntities[3].score).toBe(95);
    });

    it('should find one entity', async () => {
      const entity = await repository.findOne({ category: 'beta' });
      expect(entity).toBeTruthy();
      expect(entity!.category).toBe('beta');
      expect(entity!.name).toBe('Entity B');
    });

    it('should return null when findOne finds nothing', async () => {
      const entity = await repository.findOne({ category: 'nonexistent' });
      expect(entity).toBeNull();
    });
  });

  describe('Entity operations', () => {
    it('should save entity through repository', async () => {
      const entity = await repository.create({
        name: 'Repository Saved',
        category: 'test'
      });

      const saved = await repository.save(entity);
      expect(saved.getId()).toBeDefined();
      expect(saved.isLoaded()).toBe(true);
    });

    it('should delete entity through repository', async () => {
      const entity = await repository.create({
        name: 'To Be Deleted',
        category: 'test'
      });
      await repository.save(entity);
      const id = entity.getId()!;

      const deleted = await repository.delete(entity);
      expect(deleted).toBe(true);

      const notFound = await repository.findById(id);
      expect(notFound).toBeNull();
    });
  });

  describe('Utility methods', () => {
    beforeEach(async () => {
      const entities = [
        { name: 'Count A', category: 'test' },
        { name: 'Count B', category: 'test' },
        { name: 'Count C', category: 'other' }
      ];

      for (const data of entities) {
        const entity = await repository.create(data);
        await entity.save();
      }
    });

    it('should count all entities', async () => {
      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should count entities with where condition', async () => {
      const testCount = await repository.count({ category: 'test' });
      expect(testCount).toBe(2);

      const otherCount = await repository.count({ category: 'other' });
      expect(otherCount).toBe(1);
    });

    it('should check entity existence', async () => {
      const exists = await repository.exists({ category: 'test' });
      expect(exists).toBe(true);

      const notExists = await repository.exists({ category: 'nonexistent' });
      expect(notExists).toBe(false);
    });
  });
});