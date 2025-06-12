# NeoGM Decorator-Based Integration Tests

This directory contains comprehensive integration tests demonstrating the decorator-based approach for NeoGM. These tests showcase real-world scenarios and provide examples of how to effectively use the new decorator API.

## Test Structure

### 🏗️ Test Entities (`/tests/models/test-entities.ts`)

Comprehensive entity models demonstrating various decorator features:

- **User**: Social networking entity with validation, transformations, and relationships
- **Company**: Business entity with complex property validation and headquarters transformation
- **Team**: Organizational unit with date transformations and hierarchical relationships
- **Post**: Content entity with status validation and engagement tracking
- **Comment**: Threaded comment system with reply relationships
- **Project**: Work management entity with priority validation and resource allocation

### 🧪 Test Suites

#### 1. **Full Workflow Integration** (`decorator-workflow.test.ts`)
- **Entity Creation & CRUD**: Complete lifecycle testing for all entity types
- **Repository Operations**: Find, create, update, delete operations with filtering and pagination
- **Property Validation**: Required fields, custom validators, and error handling
- **Property Transformation**: Date serialization, JSON transformation, and data mapping
- **Complex Workflows**: Multi-step business processes and entity interactions
- **Query Builder Integration**: Testing with both fluent and raw query APIs
- **Performance Testing**: Bulk operations and concurrent processing

#### 2. **Relationship Management** (`relationship-management.test.ts`)
- **Employment Relationships**: Company-user-team hierarchies with position data
- **Team Structures**: Team membership, leadership, and organizational charts
- **Social Networks**: Following relationships and engagement patterns
- **Content Interactions**: Post creation, likes, comments, and threaded discussions
- **Project Assignments**: Resource allocation and team collaboration
- **Analytics Queries**: Cross-team analysis and performance metrics
- **Relationship Maintenance**: Updates, deletions, and data integrity

#### 3. **Complete Real-World Simulation** (`complete-workflow.test.ts`)
- **Tech Company Simulation**: End-to-end startup workflow from foundation to operations
- **Organizational Development**: Team building, role assignments, and leadership structures
- **Project Lifecycle**: From conception to execution with resource management
- **Knowledge Sharing**: Content creation, engagement, and community building
- **Advanced Analytics**: Multi-dimensional queries and business intelligence
- **Performance Benchmarks**: Scalability testing with realistic data volumes

## Key Features Demonstrated

### 🎯 **Decorator Patterns**

```typescript
@Node('User')
class User extends BaseEntity {
  @Property({ required: true, unique: true })
  username!: string;

  @Property({ 
    validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  })
  email!: string;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Relationship('FOLLOWS', () => User, { direction: 'out' })
  following?: User[];
}
```

### 🔄 **Repository Pattern**

```typescript
const userRepo = neogm.getRepository(User);
const user = await userRepo.create({ username: 'alice', email: 'alice@example.com' });
await user.save();

const users = await userRepo.find({ where: { isActive: true }, limit: 10 });
const activeUserCount = await userRepo.count({ isActive: true });
```

### 📊 **Complex Analytics**

```typescript
// Cross-team collaboration analysis
const collaboration = await neogm.queryBuilder()
  .match('(u1:User)-[:FOLLOWS]->(u2:User), (u1)-[:MEMBER_OF]->(t1:Team), (u2)-[:MEMBER_OF]->(t2:Team)')
  .where('t1.name <> t2.name')
  .return('t1.name as team1, t2.name as team2, count(*) as connections')
  .execute();
```

## Test Scenarios

### 🏢 **Enterprise Workflows**
- Company foundation and team structure setup
- Employee onboarding and role assignment
- Project initiation and resource allocation
- Performance tracking and analytics

### 🤝 **Social Interactions**
- User following and networking
- Content creation and engagement
- Knowledge sharing through posts and comments
- Community building and collaboration

### 📈 **Analytics & Reporting**
- Employee distribution analysis
- Project resource utilization
- Social network influence mapping
- Content engagement metrics
- Cross-functional collaboration patterns

### ⚡ **Performance Testing**
- Bulk entity creation (50+ entities)
- Concurrent operations (10+ parallel)
- Complex multi-join queries
- Large dataset analytics
- Response time benchmarking

## Validation Examples

### 🔍 **Property Validation**
```typescript
// Email format validation
@Property({ 
  validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
})
email!: string;

// Age range validation
@Property({
  validator: (age: number) => age >= 13 && age <= 120
})
age?: number;

// Array length validation
@Property({
  validator: (tags: string[]) => Array.isArray(tags) && tags.length <= 10
})
tags?: string[];
```

### 🔄 **Data Transformation**
```typescript
// Date serialization
@Property({
  transformer: {
    to: (date: Date) => date.toISOString(),
    from: (isoString: string) => new Date(isoString)
  }
})
createdAt?: Date;

// Complex object transformation
@Property({
  transformer: {
    to: (location: { city: string; country: string }) => JSON.stringify(location),
    from: (json: string) => JSON.parse(json)
  }
})
headquarters?: { city: string; country: string };
```

## Running the Tests

```bash
# Run all integration tests
yarn test:integration

# Run specific test file
yarn test tests/integration/decorator-workflow.test.ts

# Run with watch mode
yarn test:watch --testMatch="**/integration/*.test.ts"

# Run with coverage
yarn test --coverage tests/integration/
```

## Performance Expectations

Based on the test suite benchmarks:

- **Entity Creation**: 50 entities in < 10 seconds
- **Complex Queries**: Multi-table joins in < 5 seconds  
- **Full Workflow**: Complete company simulation in < 35 seconds
- **Concurrent Operations**: 10 parallel operations successfully
- **Memory Usage**: Stable across large datasets

## Test Data Overview

The complete workflow creates:
- **1 Company** with full organizational structure
- **2 Teams** (Engineering & Product) with leadership
- **5 Users** with diverse roles and specializations  
- **1 Major Project** with comprehensive assignments
- **2 Blog Posts** with community engagement
- **4+ Comments** with threaded discussions
- **6+ Social Relationships** across teams
- **Multiple Role Assignments** and resource allocations

This provides a realistic dataset for testing all decorator features and relationship patterns in a production-like environment.