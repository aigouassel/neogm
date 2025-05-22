# Multi-Database Connection Support

The NeoGM Data Access Layer includes support for multiple database connections, both for different databases within a single Neo4j instance (Neo4j Enterprise Edition) and for connecting to multiple Neo4j instances.

## Configuration

Multi-database support is configured through the connection configuration:

```typescript
import { initNeo4j } from 'neogm';

// Initialize with multiple database connections
initNeo4j({
  default: 'primary', // Default database to use
  databases: {
    primary: {
      name: 'primary',
      uri: 'neo4j://primary-server:7687',
      auth: {
        username: 'neo4j',
        password: 'primary-password'
      }
    },
    analytics: {
      name: 'analytics',
      uri: 'neo4j://analytics-server:7687',
      auth: {
        username: 'neo4j',
        password: 'analytics-password'
      },
      // Optional custom pool configuration
      pool: {
        maxSize: 200,
        maxConnectionLifetime: 7200000 // 2 hours
      }
    }
  }
});
```

## Usage

### Database-specific Sessions

You can obtain sessions for specific databases:

```typescript
import { getSessionManager } from 'neogm';

// Get session for default database
const defaultSession = getSessionManager().getSession();

// Get session for a specific database
const analyticsSession = getSessionManager().getSession({ database: 'analytics' });

try {
  // Use sessions with their respective databases
  await defaultSession.run('CREATE (n:User {name: $name})', { name: 'Alice' });
  await analyticsSession.run('CREATE (n:Metric {type: $type})', { type: 'PageView' });
} finally {
  // Always close sessions
  await defaultSession.close();
  await analyticsSession.close();
}
```

### Database-specific Queries

You can execute queries on specific databases:

```typescript
import { getQueryRunner } from 'neogm';

// Query the default database
const users = await getQueryRunner().run(
  'MATCH (u:User) RETURN u.name as name',
  {},
  undefined,
  {} // Default database
);

// Query a specific database
const metrics = await getQueryRunner().run(
  'MATCH (m:Metric) RETURN m.type as type, count(*) as count',
  {},
  undefined,
  { database: 'analytics' }
);
```

### Transaction Management

Transactions are database-specific:

```typescript
import { getSessionManager } from 'neogm';

// Execute a transaction on a specific database
await getSessionManager().withSession(async (session) => {
  const tx = session.beginTransaction();
  try {
    await tx.run('CREATE (n:Report {name: $name})', { name: 'Q1 Results' });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}, { database: 'reporting' });
```

## Limitations

1. **Enterprise Edition Required**: Multi-database support within a single Neo4j instance requires Neo4j Enterprise Edition.

2. **Singleton Management**: The connection, session, and query managers are implemented as singletons, meaning only one global configuration can be active at a time. You can dynamically switch configurations using `closeAll()` followed by `init()`, but you cannot have multiple active configurations simultaneously.

3. **Database Creation**: The library doesn't currently handle creating or dropping databases. These operations would need to be performed directly in Neo4j.

## Best Practices

1. **Connection Sharing**: Reuse sessions instead of creating new ones for every operation.

2. **Error Handling**: When working with multiple databases, handle connection errors gracefully, as some databases might be unavailable.

3. **Proper Cleanup**: Always close sessions when done, especially when working with multiple databases, to prevent resource leaks.