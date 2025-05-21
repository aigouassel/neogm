/**
 * Jest setup file for Neo4j integration tests
 * 
 * This file is executed before running tests to set up the Neo4j test environment.
 */

import { Neo4jTestContainer } from './neo4j-test-container';
import { initNeo4j, closeNeo4j } from '../../index';

// Create global test container instance
const testContainer = new Neo4jTestContainer();

// Setup/teardown hooks
beforeAll(async () => {
  // Start Neo4j container
  const connectionConfig = await testContainer.start();
  
  // Initialize Neo4j connection
  initNeo4j(connectionConfig);
  
  // Add connection config to global object for tests
  global.__TEST_NEO4J_CONFIG__ = connectionConfig;
}, 60000); // 60 second timeout for container startup

afterAll(async () => {
  // Close Neo4j connections
  await closeNeo4j();
  
  // Stop Neo4j container
  await testContainer.stop();
}, 30000); // 30 second timeout for container shutdown