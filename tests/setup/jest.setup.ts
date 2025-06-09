import { testConfig } from './test-config';

// Increase timeout for integration tests
jest.setTimeout(30000);

beforeAll(() => {
  // Ensure test environment variables are set
  if (!process.env.NEO4J_URI && !testConfig.uri) {
    console.warn('Warning: NEO4J_URI not set, using default bolt://localhost:7687');
  }
  
  if (!process.env.NEO4J_PASSWORD && testConfig.password === 'password') {
    console.warn('Warning: Using default password "password" for Neo4j tests');
  }
});

afterAll(async () => {
  // Global cleanup if needed
});