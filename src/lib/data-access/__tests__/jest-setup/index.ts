/**
 * Jest setup file for Neo4j integration tests
 *
 * This file is executed before running tests to set up the Neo4j test environment.
 */

import { Neo4jTestContainer, Neo4jTestContainerConfig } from './neo4j-docker-setup';
import { initNeo4j, closeNeo4j } from '../../index';

/**
 * Default test container configuration
 */
const DEFAULT_CONFIG: Neo4jTestContainerConfig = {
  projectRoot: process.cwd(),
  composeFile: 'docker-compose.test.yml',
  connectionConfig: {
    uri: 'neo4j://localhost:7687',
    auth: {
      username: 'neo4j',
      password: 'testpassword'
    }
  },
  serviceName: 'neo4j',
  startupTimeout: 30000 // 30 seconds
};

// Create global test container instance
const testContainer = new Neo4jTestContainer(DEFAULT_CONFIG);

// Setup/teardown hooks
beforeAll(async () => {
  try {
    // Start Neo4j container
    const connectionConfig = await testContainer.start();

    // Initialize Neo4j connection
    initNeo4j(connectionConfig);
  } catch (err) {
    console.error('Error in Jest beforeAll setup:', err);
    throw err;
  }
}, 60000); // 60 second timeout for container startup

afterAll(async () => {
  try {
    // Close Neo4j connections
    await closeNeo4j();

    // Stop Neo4j container
    await testContainer.stop();
  } catch (err) {
    console.error('Error in Jest afterAll teardown:', err);
  }
}, 30000); // 30 second timeout for container shutdown