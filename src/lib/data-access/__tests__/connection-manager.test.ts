/**
 * Tests for connection manager
 */

import { ConnectionManager } from '../connection-manager';
import neo4j from 'neo4j-driver';

// Mock the neo4j driver
jest.mock('neo4j-driver', () => {
  const mockSession = {
    run: jest.fn().mockResolvedValue({ records: [] }),
    close: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockDriver = {
    session: jest.fn().mockReturnValue(mockSession),
    close: jest.fn().mockResolvedValue(undefined)
  };
  
  return {
    driver: jest.fn().mockReturnValue(mockDriver),
    auth: {
      basic: jest.fn().mockReturnValue({ scheme: 'basic', principal: '', credentials: '' })
    },
    session: {
      READ: 'READ',
      WRITE: 'WRITE'
    }
  };
});

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  
  beforeEach(() => {
    // Reset the singleton instance
    // @ts-ignore - Accessing private property for testing
    ConnectionManager.instance = undefined;
    connectionManager = ConnectionManager.getInstance();
    
    // Clear mock calls
    jest.clearAllMocks();
  });
  
  it('should be a singleton', () => {
    const instance1 = ConnectionManager.getInstance();
    const instance2 = ConnectionManager.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should initialize with string config', () => {
    connectionManager.init('neo4j://localhost');
    expect(connectionManager).toBeDefined();
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.isInitialized).toBe(true);
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.defaultDatabase).toBe('default');
  });
  
  it('should initialize with object config', () => {
    connectionManager.init({
      uri: 'neo4j://localhost',
      auth: {
        username: 'neo4j',
        password: 'password'
      }
    });
    
    expect(connectionManager).toBeDefined();
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.isInitialized).toBe(true);
  });
  
  it('should initialize with multi-database config', () => {
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'password'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://analytics:7687',
          auth: {
            username: 'neo4j',
            password: 'password'
          }
        }
      }
    });
    
    expect(connectionManager).toBeDefined();
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.isInitialized).toBe(true);
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.defaultDatabase).toBe('main');
  });
  
  it('should create a driver when getting a session', () => {
    connectionManager.init('neo4j://localhost');
    const session = connectionManager.getSession();
    
    expect(session).toBeDefined();
    expect(neo4j.driver).toHaveBeenCalled();
  });
  
  it('should create a driver for a specific database', () => {
    connectionManager.init({
      default: 'main',
      databases: {
        main: {
          name: 'main',
          uri: 'neo4j://localhost:7687',
          auth: {
            username: 'neo4j',
            password: 'password'
          }
        },
        analytics: {
          name: 'analytics',
          uri: 'neo4j://analytics:7687',
          auth: {
            username: 'neo4j',
            password: 'analytics'
          }
        }
      }
    });
    
    const session = connectionManager.getSessionForDatabase('analytics');
    
    expect(session).toBeDefined();
    expect(neo4j.driver).toHaveBeenCalledWith(
      'neo4j://analytics:7687',
      expect.anything(),
      expect.anything()
    );
  });
  
  it('should throw an error if not initialized', () => {
    expect(() => {
      connectionManager.getSession();
    }).toThrow('ConnectionManager is not initialized');
  });
  
  it('should throw an error if database not found', () => {
    connectionManager.init('neo4j://localhost');
    
    expect(() => {
      connectionManager.getSessionForDatabase('non-existent');
    }).toThrow('Database configuration not found');
  });
  
  it('should close all drivers', async () => {
    connectionManager.init('neo4j://localhost');
    connectionManager.getSession(); // Create a driver
    
    await connectionManager.closeAll();
    
    // @ts-ignore - Accessing mock for testing
    expect(neo4j.driver().close).toHaveBeenCalled();
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(0);
    
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.isInitialized).toBe(false);
  });
});