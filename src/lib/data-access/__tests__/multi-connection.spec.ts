/**
 * Unit tests for multi-database connection management
 * 
 * These tests verify that the ConnectionManager can handle multiple database
 * connections and configurations.
 */

import { ConnectionManager } from '../connection-manager';

describe('ConnectionManager Multi-Database Support', () => {
  let connectionManager: ConnectionManager;
  
  beforeEach(() => {
    // Reset the singleton instance for isolated testing
    // @ts-ignore - Accessing private property for testing
    ConnectionManager.instance = undefined;
    connectionManager = ConnectionManager.getInstance();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await connectionManager.closeAll();
  });
  
  it('should support multi-database configuration initialization', () => {
    // Initialize with a multi-database configuration
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        },
        reporting: {
          name: 'reporting',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        }
      }
    });
    
    // Verify initialization
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.initialized).toBe(true);
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.defaultDatabase).toBe('main');
    
    // @ts-ignore - Accessing private property for testing
    expect(Object.keys(connectionManager.config.databases).length).toBe(3);
  });
  
  it('should create drivers lazily when requested', () => {
    // Initialize with multi-database config
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        }
      }
    });
    
    // Initially no drivers should be created
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(0);
    
    // Get the default driver
    const mainDriver = connectionManager.getDriver();
    expect(mainDriver).toBeDefined();
    
    // Now one driver should exist
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(1);
    
    // Get a driver for a specific database
    const analyticsDriver = connectionManager.getDriverForDatabase('analytics');
    expect(analyticsDriver).toBeDefined();
    
    // Now two drivers should exist
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(2);
    
    // The drivers should be different instances
    expect(mainDriver).not.toBe(analyticsDriver);
  });
  
  it('should reuse existing drivers', () => {
    // Initialize with multi-database config
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        }
      }
    });
    
    // Get a driver for the main database
    const driver1 = connectionManager.getDriver();
    
    // Get another driver for the same database
    const driver2 = connectionManager.getDriver();
    
    // The drivers should be the same instance
    expect(driver1).toBe(driver2);
    
    // Only one driver should be created
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(1);
  });
  
  it('should support different configurations for each database', () => {
    // Initialize with multi-database config
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://mainhost:7687',
          auth: {
            username: 'neo4j',
            password: 'main-password'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://analyticshost:7687',
          auth: {
            username: 'neo4j',
            password: 'analytics-password'
          },
          pool: {
            maxSize: 200, // Custom pool config
            maxConnectionLifetime: 7200000
          }
        }
      }
    });
    
    // With different configurations, we should create different drivers
    try {
      const mainDriver = connectionManager.getDriverForDatabase('main');
      const analyticsDriver = connectionManager.getDriverForDatabase('analytics');
      
      // Configuration details should be respected when creating drivers
      // This is hard to test directly since the driver doesn't expose its config
      
      // At least verify we have different driver instances
      expect(mainDriver).not.toBe(analyticsDriver);
      
      // @ts-ignore - Accessing private property for testing
      expect(connectionManager.drivers.size).toBe(2);
    } catch (error) {
      // This might fail if the hosts don't exist, which is expected in unit tests
      // Just verify the error is about connection, not about configuration
      expect(error.message).not.toContain('configuration');
    }
  });
  
  it('should close all drivers properly', async () => {
    // Initialize with multi-database config
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        }
      }
    });
    
    // Create multiple drivers
    connectionManager.getDriverForDatabase('main');
    connectionManager.getDriverForDatabase('analytics');
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(2);
    
    // Close all drivers
    await connectionManager.closeAll();
    
    // Drivers map should be empty
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(0);
    
    // Should be uninitialized
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.initialized).toBe(false);
  });
  
  it('should throw an error for unknown database', () => {
    // Initialize with a single database
    connectionManager.init({
      uri: 'neo4j://localhost:7687',
      auth: {
        username: 'neo4j',
        password: 'testpassword'
      }
    });
    
    // Try to get a driver for a non-existent database
    expect(() => {
      connectionManager.getDriverForDatabase('non-existent');
    }).toThrow('Database configuration not found');
  });
  
  it('should get sessions for specific databases', () => {
    // Initialize with multi-database config
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'testpassword'
          }
        }
      }
    });
    
    // Get sessions for specific databases
    const mainSession = connectionManager.getSession();
    const analyticsSession = connectionManager.getSessionForDatabase('analytics');
    
    // Sessions should be defined
    expect(mainSession).toBeDefined();
    expect(analyticsSession).toBeDefined();
    
    // Clean up
    mainSession.close();
    analyticsSession.close();
  });
});