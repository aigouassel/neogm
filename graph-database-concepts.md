# Core Graph Database Concepts

This document outlines the fundamental concepts in graph databases like Neo4j, which our NeoGM library will model.

## Primary Elements

### 1. Nodes (Vertices)

Nodes represent entities in the domain model and serve as the primary data containers.

**Characteristics:**
- Have one or more **labels** (categories or types)
- Contain **properties** (key-value pairs)
- Possess a unique identifier
- Can exist independently of relationships

**Example:**
```cypher
CREATE (p:Person {name: "Alice", age: 30})
```

This creates a node with:
- Label: `Person`
- Properties: `name` ("Alice") and `age` (30)

### 2. Relationships (Edges)

Relationships connect nodes and express the associations between entities.

**Characteristics:**
- Always have a specific **type** (e.g., "FOLLOWS", "PURCHASED")
- Always have a **direction** (from one node to another)
- Can contain **properties** like nodes
- Must connect two nodes (cannot exist independently)
- Create the "graph" structure

**Example:**
```cypher
MATCH (a:Person {name: "Alice"}), (b:Person {name: "Bob"})
CREATE (a)-[r:KNOWS {since: 2022}]->(b)
```

This creates a relationship:
- Type: `KNOWS`
- Direction: from Alice to Bob
- Property: `since` (2022)

### 3. Properties

Properties are the attributes attached to both nodes and relationships.

**Characteristics:**
- Key-value pairs
- Can be primitive types (strings, numbers, booleans, dates)
- Can be arrays of primitive types
- Cannot be nested objects (unlike document databases)
- Can be indexed for performance
- Can be null or absent

**Example:**
```cypher
CREATE (p:Product {
  name: "Smartphone",
  price: 699.99,
  available: true,
  tags: ["electronics", "mobile", "5G"],
  releaseDate: date("2023-01-15")
})
```

### 4. Labels

Labels are tags for nodes that indicate their role, type, or category.

**Characteristics:**
- A node can have multiple labels
- Used for categorizing nodes
- Improve query performance
- Often used in queries to find nodes of a specific type

**Example:**
```cypher
CREATE (p:Person:Employee:Manager {name: "Carol"})
```

This creates a node with three labels: `Person`, `Employee`, and `Manager`.

### 5. Paths

Paths are sequences of alternating nodes and relationships.

**Characteristics:**
- Represent traversals through the graph
- Can be of variable length
- Enable complex graph pattern matching
- Central to graph query operations

**Example:**
```cypher
MATCH path = (a:Person {name: "Alice"})-[:FOLLOWS*1..3]->(b:Person)
RETURN path
```

This finds all paths from 1 to 3 relationships long where Alice follows someone who (potentially) follows others.

## Additional Concepts

### 1. Indexes

Indexes improve the performance of property lookups in the graph.

**Example:**
```cypher
CREATE INDEX FOR (p:Person) ON (p.email)
```

### 2. Constraints

Constraints enforce data integrity rules.

**Example:**
```cypher
CREATE CONSTRAINT FOR (p:Person) REQUIRE p.email IS UNIQUE
```

### 3. Graph Traversal

The process of exploring the graph by following relationships from node to node.

**Example:**
```cypher
MATCH (a:Person {name: "Alice"})-[:FOLLOWS]->(:Person)-[:FOLLOWS]->(recommendation:Person)
WHERE NOT (a)-[:FOLLOWS]->(recommendation)
RETURN DISTINCT recommendation
```

This finds "friends of friends" that Alice might want to follow (recommendation).

## How These Concepts Map to OGM

In our Object Graph Mapping (OGM) library:

1. **Nodes** will map to model classes
2. **Labels** will be defined in decorators or schema definitions
3. **Relationships** will be represented as methods and/or properties on model classes
4. **Properties** will map to class properties with type definitions
5. **Paths** will be the result of query operations

Our library will abstract these graph concepts into a familiar object-oriented paradigm while maintaining the power and flexibility of the graph model.