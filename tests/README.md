# NeoGM Tests

This directory contains comprehensive tests for the NeoGM Neo4j ORM library.

## Test Structure

```
tests/
├── setup/                  # Test configuration and setup
│   ├── test-config.ts     # Neo4j connection configuration for tests
│   └── jest.setup.ts      # Jest global setup
├── unit/                  # Unit tests for individual components
│   ├── connection.test.ts # ConnectionManager tests
│   ├── node.test.ts       # Node class tests
│   ├── relationship.test.ts # Relationship class tests
│   ├── query-builder.test.ts # QueryBuilder tests
│   └── neogm.test.ts      # Main NeoGM class tests
├── integration/           # Integration tests
│   └── full-workflow.test.ts # End-to-end workflow tests
└── jest.config.js         # Jest configuration for tests
```

## Running Tests

### Prerequisites

1. **Neo4j Database**: Ensure you have a Neo4j database running locally or accessible remotely.

2. **Environment Variables** (optional):
   ```bash
   export NEO4J_URI=bolt://localhost:7687
   export NEO4J_USER=neo4j
   export NEO4J_PASSWORD=your_password
   export NEO4J_DATABASE=neo4j
   ```

3. **Docker Setup** (recommended for testing):
   ```bash
   # Start Neo4j using docker-compose
   yarn docker:up
   
   # View logs
   yarn docker:logs
   
   # Stop and clean up
   yarn docker:down
   ```

### Test Commands

```bash
# Run all tests
yarn test

# Run only unit tests
yarn test:unit

# Run only integration tests
yarn test:integration

# Run tests in watch mode
yarn test:watch

# Run tests from the tests directory
cd tests
yarn jest
```

## Test Categories

### Unit Tests
- **Connection Tests**: Test database connection management
- **Node Tests**: Test node creation, saving, finding, and deletion
- **Relationship Tests**: Test relationship creation and management
- **Query Builder Tests**: Test query construction and execution
- **NeoGM Tests**: Test the main ORM class functionality

### Integration Tests
- **Full Workflow Tests**: End-to-end scenarios testing complete workflows
- **Transaction Tests**: Test transaction handling and rollback scenarios
- **Complex Query Tests**: Test advanced querying capabilities
- **Performance Tests**: Test pagination and large dataset handling

## Test Data

All tests use isolated test data and clean up after themselves. Each test suite:
- Clears the database before running tests
- Creates only the data needed for specific tests
- Cleans up test data after completion

## Configuration

The test configuration is defined in `setup/test-config.ts` and can be customized using environment variables:

- `NEO4J_URI`: Database connection URI (default: bolt://localhost:7687)
- `NEO4J_USER`: Database username (default: neo4j)
- `NEO4J_PASSWORD`: Database password (default: password)
- `NEO4J_DATABASE`: Database name (default: neo4j)

## Troubleshooting

### Connection Issues
- Ensure Neo4j is running and accessible
- Check firewall settings for port 7687
- Verify credentials are correct

### Test Timeouts
- Tests have a 30-second timeout by default
- Increase timeout in jest.config.js if needed for slow environments

### Docker Issues
- Ensure Docker is running
- Check if port 7687 is available
- Run `yarn docker:restart` to reset containers