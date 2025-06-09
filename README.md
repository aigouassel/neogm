# NeoGM - Neo4j Object Graph Mapper

A TypeScript-first Neo4j ORM (Object Relational Mapper) for building type-safe graph database applications. NeoGM provides an intuitive API for working with Neo4j databases while maintaining full type safety and excellent developer experience.

## Features

- **TypeScript Native**: Built from the ground up with TypeScript for excellent type safety and developer experience
- **Graph-First**: Designed specifically for graph database patterns and workflows  
- **Neo4j Optimized**: Leverages Neo4j's unique capabilities and performance characteristics
- **Single Connection**: Handles single database connections efficiently
- **Comprehensive ORM**: Complete CRUD operations for nodes and relationships
- **Query Builder**: Fluent API for building complex Cypher queries
- **Transaction Support**: Full transaction handling with rollback capabilities
- **Extensive Testing**: Comprehensive test suite with unit and integration tests

## Installation

```bash
yarn add neogm
# or
npm install neogm
```

## Quick Start

```typescript
import { NeoGM } from 'neogm';

// Initialize connection
const neogm = new NeoGM({
  uri: 'bolt://localhost:7687',
  user: 'neo4j',
  password: 'your-password',
  database: 'neo4j'  // optional
});

// Connect to database
await neogm.connect();

// Create nodes
const person = neogm.createNode('Person', {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
});

await person.save();

// Create relationships
const company = neogm.createNode('Company', { name: 'TechCorp' });
await company.save();

const employment = neogm.createRelationship('WORKS_FOR', person, company, {
  position: 'Software Engineer',
  startDate: '2021-01-15'
});

await employment.save();

// Query data
const employees = await neogm.queryBuilder()
  .match('(p:Person)-[:WORKS_FOR]->(c:Company)')
  .where({ 'c.name': 'TechCorp' })
  .return('p.name as name, p.email as email')
  .execute();

console.log('Employees:', employees.records);

// Clean up
await neogm.disconnect();
```

## Core Concepts

### Nodes

Nodes represent entities in your graph database:

```typescript
// Create a node
const user = neogm.createNode('User', {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25
});

// Save to database
await user.save();

// Update properties
user.setProperty('age', 26);
await user.save();

// Find nodes
const allUsers = await neogm.findNodes('User');
const specificUser = await neogm.findOneNode('User', { username: 'john_doe' });
const userById = await neogm.findNodeById(123, 'User');

// Delete node
await user.delete();
```

### Relationships

Relationships connect nodes and can have properties:

```typescript
// Create relationship between existing nodes
const follows = neogm.createRelationship('FOLLOWS', user1, user2, {
  since: '2023-01-15',
  type: 'friend'
});

await follows.save();

// Find relationships
const allFollows = await neogm.findRelationships('FOLLOWS');
const specificRel = await neogm.findRelationshipById(456, 'FOLLOWS');
const between = await neogm.findRelationshipsBetweenNodes(
  user1.getId()!, 
  user2.getId()!, 
  'FOLLOWS'
);

// Delete relationship
await follows.delete();
```

### Query Builder

Build complex Cypher queries with a fluent API:

```typescript
const result = await neogm.queryBuilder()
  .match('(u:User)-[:FOLLOWS]->(f:User)')
  .where({ 'u.age': 25 })
  .return('u.username, count(f) as followingCount')
  .orderBy('followingCount', 'DESC')
  .limit(10)
  .execute();
```

### Raw Queries

Execute raw Cypher queries when needed:

```typescript
const result = await neogm.rawQuery().execute(`
  MATCH (u:User)
  WHERE u.age > $minAge
  RETURN u.username, u.email
  ORDER BY u.age DESC
`, { minAge: 18 });

// Transaction with multiple queries
await neogm.rawQuery().executeInTransaction([
  { query: 'CREATE (u:User {name: $name})', parameters: { name: 'Alice' } },
  { query: 'CREATE (u:User {name: $name})', parameters: { name: 'Bob' } }
]);
```

### Transactions

Handle complex operations with transactions:

```typescript
await neogm.executeInTransaction(async (tx) => {
  // All operations within this block are part of the same transaction
  await tx.run('CREATE (u:User {name: $name})', { name: 'Alice' });
  await tx.run('CREATE (c:Company {name: $name})', { name: 'TechCorp' });
  
  // If any operation fails, the entire transaction is rolled back
  await tx.run(`
    MATCH (u:User {name: $userName}), (c:Company {name: $companyName})
    CREATE (u)-[:WORKS_FOR]->(c)
  `, { userName: 'Alice', companyName: 'TechCorp' });
});
```

## API Reference

### NeoGM Class

The main class for interacting with Neo4j:

- `connect()`: Connect to the database
- `disconnect()`: Close the database connection
- `createNode(label, properties)`: Create a new node instance
- `createRelationship(type, startNode, endNode, properties)`: Create a new relationship
- `findNodeById(id, label)`: Find a node by its ID
- `findNodes(label, where?, options?)`: Find multiple nodes
- `findOneNode(label, where)`: Find a single node
- `queryBuilder()`: Get a query builder instance
- `rawQuery()`: Get a raw query executor
- `executeInTransaction(fn)`: Execute operations in a transaction
- `clearDatabase()`: Remove all nodes and relationships (useful for testing)

### Node Class

Represents a node in the graph:

- `save()`: Save the node to the database
- `delete()`: Delete the node from the database
- `setProperty(key, value)`: Set a property value
- `getProperty(key)`: Get a property value
- `getProperties()`: Get all properties
- `getId()`: Get the node's database ID
- `getLabel()`: Get the node's label

### Relationship Class

Represents a relationship between nodes:

- `save()`: Save the relationship to the database
- `delete()`: Delete the relationship from the database
- `setProperty(key, value)`: Set a property value
- `getProperty(key)`: Get a property value
- `getProperties()`: Get all properties
- `getId()`: Get the relationship's database ID
- `getType()`: Get the relationship type
- `getStartNode()`: Get the starting node
- `getEndNode()`: Get the ending node

## Development

### Prerequisites

- Node.js 18+
- Neo4j Database (local or remote)
- Docker (optional, for local Neo4j)

### Setup

1. Clone the repository
2. Install dependencies: `yarn install`
3. Start Neo4j: `yarn docker:up` (or use your own instance)
4. Run tests: `yarn test`

### Development Commands

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test
yarn test:unit        # Unit tests only
yarn test:integration # Integration tests only  
yarn test:watch       # Watch mode

# Linting and formatting
yarn lint

# Docker commands for Neo4j
yarn docker:up        # Start Neo4j container
yarn docker:down      # Stop and remove containers
yarn docker:logs      # View container logs
yarn docker:restart   # Restart containers
```

### Testing

The project includes comprehensive test coverage in the `tests/` directory:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete workflows and interactions
- **Setup**: Test configuration and utilities

See `tests/README.md` for detailed testing documentation.

## Examples

Check the `examples/` directory for more comprehensive usage examples:

- `basic-usage.ts`: Complete example showing all major features

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `yarn test`
6. Run linting: `yarn lint`
7. Submit a pull request

## License

ISC

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/aigouassel/neorm).