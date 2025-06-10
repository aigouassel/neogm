import { Node, Property, Relationship, MetadataStorage } from '../../src/lib/decorators';
import { BaseEntity, Repository } from '../../src/lib/entity';
import { ConnectionManager } from '../../src/lib/connection';

describe('Decorators', () => {
  let connectionManager: ConnectionManager;
  let metadata: MetadataStorage;

  beforeEach(() => {
    connectionManager = new ConnectionManager({
      uri: 'bolt://localhost:7687',
      user: 'neo4j',
      password: 'test'
    });
    metadata = MetadataStorage.getInstance();
  });

  afterEach(() => {
    // Clear metadata between tests
    (metadata as any).nodeMetadata.clear();
  });

  describe('@Node decorator', () => {
    it('should register node metadata with default label', () => {
      @Node()
      class TestEntity extends BaseEntity {}

      const nodeMetadata = metadata.getNodeMetadata(TestEntity);
      expect(nodeMetadata).toBeDefined();
      expect(nodeMetadata!.label).toBe('TestEntity');
    });

    it('should register node metadata with custom label', () => {
      @Node('CustomLabel')
      class TestEntity extends BaseEntity {}

      const nodeMetadata = metadata.getNodeMetadata(TestEntity);
      expect(nodeMetadata).toBeDefined();
      expect(nodeMetadata!.label).toBe('CustomLabel');
    });

    it('should register node metadata with options', () => {
      @Node({ label: 'OptionsLabel' })
      class TestEntity extends BaseEntity {}

      const nodeMetadata = metadata.getNodeMetadata(TestEntity);
      expect(nodeMetadata).toBeDefined();
      expect(nodeMetadata!.label).toBe('OptionsLabel');
    });
  });

  describe('@Property decorator', () => {
    it('should register property metadata', () => {
      @Node()
      class TestEntity extends BaseEntity {
        @Property()
        name!: string;
      }

      const propertyMetadata = metadata.getPropertyMetadata(TestEntity, 'name');
      expect(propertyMetadata).toBeDefined();
      expect(propertyMetadata!.key).toBe('name');
      expect(propertyMetadata!.type).toBe(String);
      expect(propertyMetadata!.required).toBe(false);
    });

    it('should register property metadata with options', () => {
      const validator = (value: string) => value.length > 0;
      const transformer = {
        to: (value: string) => value.toUpperCase(),
        from: (value: string) => value.toLowerCase()
      };

      @Node()
      class TestEntity extends BaseEntity {
        @Property({ 
          required: true, 
          unique: true, 
          indexed: true,
          validator,
          transformer
        })
        name!: string;
      }

      const propertyMetadata = metadata.getPropertyMetadata(TestEntity, 'name');
      expect(propertyMetadata).toBeDefined();
      expect(propertyMetadata!.required).toBe(true);
      expect(propertyMetadata!.unique).toBe(true);
      expect(propertyMetadata!.indexed).toBe(true);
      expect(propertyMetadata!.validator).toBe(validator);
      expect(propertyMetadata!.transformer).toBe(transformer);
    });
  });

  describe('@Relationship decorator', () => {
    it('should register relationship metadata', () => {
      @Node()
      class Person extends BaseEntity {}

      @Node()
      class Company extends BaseEntity {
        @Relationship('WORKS_FOR', () => Person, { direction: 'in' })
        employees!: Person[];
      }

      const relationshipMetadata = metadata.getRelationshipMetadata(Company, 'employees');
      expect(relationshipMetadata).toBeDefined();
      expect(relationshipMetadata!.key).toBe('employees');
      expect(relationshipMetadata!.type).toBe('WORKS_FOR');
      expect(relationshipMetadata!.direction).toBe('in');
      expect(relationshipMetadata!.multiple).toBe(true);
      expect(relationshipMetadata!.target()).toBe(Person);
    });

    it('should detect single vs multiple relationships', () => {
      @Node()
      class Person extends BaseEntity {}

      @Node()
      class TestEntity extends BaseEntity {
        @Relationship('SINGLE', () => Person)
        singleRelation!: Person;

        @Relationship('MULTIPLE', () => Person)
        multipleRelations!: Person[];
      }

      const singleMeta = metadata.getRelationshipMetadata(TestEntity, 'singleRelation');
      const multipleMeta = metadata.getRelationshipMetadata(TestEntity, 'multipleRelations');

      expect(singleMeta!.multiple).toBe(false);
      expect(multipleMeta!.multiple).toBe(true);
    });

    it('should default to outgoing direction', () => {
      @Node()
      class Person extends BaseEntity {}

      @Node()
      class TestEntity extends BaseEntity {
        @Relationship('FOLLOWS', () => Person)
        following!: Person[];
      }

      const relationshipMetadata = metadata.getRelationshipMetadata(TestEntity, 'following');
      expect(relationshipMetadata!.direction).toBe('out');
    });
  });

  describe('Integration', () => {
    it('should work with multiple decorators on same class', () => {
      @Node('CompleteEntity')
      class CompleteEntity extends BaseEntity {
        @Property({ required: true })
        name!: string;

        @Property()
        age?: number;

        @Relationship('RELATED_TO', () => CompleteEntity)
        related?: CompleteEntity;
      }

      const nodeMetadata = metadata.getNodeMetadata(CompleteEntity);
      expect(nodeMetadata).toBeDefined();
      expect(nodeMetadata!.label).toBe('CompleteEntity');
      expect(nodeMetadata!.properties.size).toBe(2);
      expect(nodeMetadata!.relationships.size).toBe(1);

      expect(nodeMetadata!.properties.has('name')).toBe(true);
      expect(nodeMetadata!.properties.has('age')).toBe(true);
      expect(nodeMetadata!.relationships.has('related')).toBe(true);
    });
  });
});