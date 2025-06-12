# NeoGM - Neo4j Object Graph Mapper

A TypeScript-first Neo4j ORM with decorator-based entities for building type-safe graph database applications. NeoGM provides an intuitive, modern API for working with Neo4j databases while maintaining full type safety and excellent developer experience.

## Features

- **Decorator-Based Entities**: Modern `@Node`, `@Property`, `@Relationship` decorators for clean entity definitions
- **TypeScript Native**: Built from the ground up with TypeScript for excellent type safety and developer experience
- **Repository Pattern**: Type-safe data access with built-in CRUD operations
- **Advanced Query Builder**: Fluent API for building complex Cypher queries
- **Transaction Support**: Full transaction handling with rollback capabilities
- **Validation & Transformation**: Built-in data validation and transformation pipeline
- **Graph-First**: Designed specifically for graph database patterns and workflows
- **Production Ready**: Comprehensive test suite with 107 tests and 95%+ coverage

## Installation

```bash
npm install neogm reflect-metadata
# or
yarn add neogm reflect-metadata
```

## Quick Start

### 1. Define Your Entities

```typescript
import { Node, Property, Relationship, BaseEntity } from 'neogm';
import 'reflect-metadata';

@Node('Person')
class Person extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property({ 
    validator: (email: string) => email.includes('@')
  })
  email!: string;

  @Property()
  age?: number;

  @Relationship({ type: 'WORKS_FOR', direction: 'OUT', target: () => Company })
  employer?: Company;

  @Relationship({ type: 'FOLLOWS', direction: 'OUT', target: () => Person })
  following?: Person[];
}

@Node('Company')
class Company extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property()
  industry?: string;

  @Relationship({ type: 'WORKS_FOR', direction: 'IN', target: () => Person })
  employees?: Person[];
}
```

### 2. Connect and Use

```typescript
import { NeoGM } from 'neogm';

// Initialize connection
const neogm = new NeoGM({
  uri: 'bolt://localhost:7687',
  user: 'neo4j',
  password: 'your-password',
  database: 'neo4j'  // optional
});

await neogm.connect();

// Get repositories
const personRepo = neogm.getRepository(Person);
const companyRepo = neogm.getRepository(Company);

// Create entities
const person = neogm.createEntity(Person, {
  name: 'Alice Johnson',
  email: 'alice@example.com',
  age: 30
});

const company = neogm.createEntity(Company, {
  name: 'TechCorp',
  industry: 'Technology'
});

// Save to database
await personRepo.save(person);
await companyRepo.save(company);

// Create relationships using raw queries
await neogm.rawQuery().execute(`
  MATCH (p:Person {id: $personId}), (c:Company {id: $companyId})
  CREATE (p)-[:WORKS_FOR {position: 'Software Engineer', startDate: '2024-01-15'}]->(c)
`, { personId: person.id, companyId: company.id });

// Query with repository
const allPeople = await personRepo.find();
const alice = await personRepo.findOne({ name: 'Alice Johnson' });
const personById = await personRepo.findById(person.getId()!);

// Advanced queries
const employees = await neogm.queryBuilder()
  .match('(p:Person)-[:WORKS_FOR]->(c:Company)')
  .where({ 'c.name': 'TechCorp' })
  .return('p.name as name, p.email as email')
  .execute();

console.log('Employees:', employees.records);

await neogm.disconnect();
```

## Core Concepts

### Entities with Decorators

Define your graph entities using modern TypeScript decorators:

```typescript
@Node('User')
class User extends BaseEntity {
  @Property({ required: true, unique: true })
  username!: string;

  @Property({ 
    required: true,
    validator: (email: string) => /\S+@\S+\.\S+/.test(email)
  })
  email!: string;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Relationship({ type: 'FOLLOWS', direction: 'OUT', target: () => User })
  following?: User[];

  @Relationship({ type: 'FOLLOWS', direction: 'IN', target: () => User })
  followers?: User[];
}
```

### Repository Pattern

Work with entities using type-safe repositories:

```typescript
const userRepo = neogm.getRepository(User);

// Create and save
const user = neogm.createEntity(User, {
  username: 'john_doe',
  email: 'john@example.com',
  createdAt: new Date()
});
await userRepo.save(user);

// Find operations
const allUsers = await userRepo.find();
const activeUsers = await userRepo.find({ where: { isActive: true } });
const john = await userRepo.findOne({ username: 'john_doe' });
const userById = await userRepo.findById(123);

// Count and existence
const userCount = await userRepo.count();
const exists = await userRepo.exists({ username: 'john_doe' });

// Delete
await userRepo.delete(user);
```

### Advanced Querying

Build complex queries with the fluent query builder:

```typescript
// Complex relationship queries
const influencers = await neogm.queryBuilder()
  .match('(u:User)<-[:FOLLOWS]-(follower:User)')
  .return('u.username as username, count(follower) as followerCount')
  .orderBy('followerCount', 'DESC')
  .limit(10)
  .execute();

// Multi-hop relationships
const friendsOfFriends = await neogm.queryBuilder()
  .match('(me:User)-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(fof:User)')
  .where({ 'me.username': 'alice' })
  .where('fof.username <> me.username')
  .return('DISTINCT fof.username as suggestion')
  .execute();

// Raw Cypher for complex scenarios
const customQuery = await neogm.rawQuery().execute(`
  MATCH (u:User)-[:FOLLOWS]->(f:User)
  WHERE u.createdAt > datetime($since)
  RETURN u.username, collect(f.username) as following
`, { since: '2024-01-01T00:00:00Z' });
```

### Transactions

Execute operations within transactions:

```typescript
// Write transaction
await neogm.executeInTransaction(async (tx) => {
  await tx.run('CREATE (u:User {username: $username})', { username: 'alice' });
  await tx.run('CREATE (u:User {username: $username})', { username: 'bob' });
  await tx.run(`
    MATCH (a:User {username: 'alice'}), (b:User {username: 'bob'})
    CREATE (a)-[:FOLLOWS]->(b)
  `);
});

// Read transaction
const result = await neogm.executeReadTransaction(async (tx) => {
  const users = await tx.run('MATCH (u:User) RETURN count(u) as count');
  return users.records[0].get('count').toNumber();
});
```

### Property Features

#### Validation

```typescript
@Node('Product')
class Product extends BaseEntity {
  @Property({ 
    required: true,
    validator: (price: number) => price > 0
  })
  price!: number;

  @Property({
    validator: (email: string) => /\S+@\S+\.\S+/.test(email)
  })
  contactEmail?: string;
}
```

#### Transformation

```typescript
@Node('Event')
class Event extends BaseEntity {
  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  eventDate!: Date;

  @Property({
    transformer: {
      to: (tags: string[]) => tags.join(','),
      from: (csv: string) => csv.split(',')
    }
  })
  tags?: string[];
}
```

## Migration from v1.x

NeoGM 2.0 introduces breaking changes with the new decorator-based approach. See the `examples/` directory for migration guides and examples.

### Key Changes:
- Replace `neogm.createNode()` with decorator-based entities and repositories
- Use `@Node`, `@Property`, `@Relationship` decorators instead of manual class definitions
- Leverage `getRepository()` for type-safe data access
- Continue using the same query builder and transaction APIs

## API Reference

### Decorators

- `@Node(label: string)` - Define a node entity
- `@Property(options?)` - Define a node property
- `@Relationship(options)` - Define a relationship

### Core Classes

- `NeoGM` - Main ORM class
- `BaseEntity` - Base class for all entities
- `Repository<T>` - Type-safe data access layer
- `QueryBuilder` - Fluent query building API

## Examples

Check out the `examples/` directory for:
- `basic-usage.ts` - Getting started with decorators
- `decorator-usage.ts` - Advanced decorator features
- Complete workflow examples

## License

ISC License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.