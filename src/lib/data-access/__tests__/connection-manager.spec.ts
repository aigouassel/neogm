/**
 * Tests for connection manager using real Neo4j instance
 */

import { ConnectionManager } from '../connection-manager';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  const testConfig = {
    uri: 'neo4j://localhost:7687',
    auth: {
      username: 'neo4j',
      password: 'testpassword'
    }
  };
  
  beforeEach(async () => {
    // We don't reset the singleton instance since the Jest setup has already initialized it
    connectionManager = ConnectionManager.getInstance();
    
    // If the tests are run in isolation, we need to initialize
    if (!(connectionManager as any).isInitialized) {
      connectionManager.init((global as any).__TEST_NEO4J_CONFIG__ || testConfig);
    }
  });
  
  it('should be a singleton', () => {
    const instance1 = ConnectionManager.getInstance();
    const instance2 = ConnectionManager.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should be properly initialized', () => {
    expect(connectionManager).toBeDefined();
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.isInitialized).toBe(true);
  });
  
  it('should get a session successfully', async () => {
    const session = connectionManager.getSession();
    
    expect(session).toBeDefined();
    
    // Test that session works by running a simple query
    const result = await session.run('RETURN 1 as num');
    expect(result.records[0].get('num').toNumber()).toBe(1);
    
    // Clean up
    await session.close();
  });
  
  it('should throw an error if database not found', () => {
    expect(() => {
      connectionManager.getSessionForDatabase('non-existent');
    }).toThrow('Database configuration not found');
  });
  
  it('should handle session closing properly', async () => {
    const session = connectionManager.getSession();
    expect(session).toBeDefined();
    
    // Session should be functional
    const result = await session.run('RETURN 1 as num');
    expect(result.records).toHaveLength(1);
    
    // Close session
    await session.close();
    
    // Trying to use a closed session should throw an error
    await expect(session.run('RETURN 1')).rejects.toThrow();
  });
  
  it('should have functional driver management', async () => {
    // Get session (creates driver if needed)
    const session = connectionManager.getSession();
    expect(session).toBeDefined();
    await session.close();
    
    // Check driver exists
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBeGreaterThan(0);
    
    // Drivers should be reused
    const oldDriversSize = (connectionManager as any).drivers.size;
    const session2 = connectionManager.getSession();
    expect(session2).toBeDefined();
    await session2.close();
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(oldDriversSize);
  });
});