/**
 * Tests for session manager using real Neo4j instance
 */

import { SessionManager } from '../session-manager';
import { ConnectionManager } from '../connection-manager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let connectionManager: ConnectionManager;
  
  beforeEach(() => {
    // We don't reset the singleton instance since the Jest setup has already initialized it
    sessionManager = SessionManager.getInstance();
    connectionManager = ConnectionManager.getInstance();
  });
  
  it('should be a singleton', () => {
    const instance1 = SessionManager.getInstance();
    const instance2 = SessionManager.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  it('should get a session from the connection manager', () => {
    const session = sessionManager.getSession();
    
    expect(session).toBeDefined();
    expect(session.run).toBeDefined();
  });
  
  it('should track active sessions', async () => {
    const session = sessionManager.getSession();
    
    // @ts-ignore - Accessing private property for testing
    expect(sessionManager.activeSessions.size).toBe(1);
    
    // Close the session
    await session.close();
    
    // @ts-ignore - Accessing private property for testing
    expect(sessionManager.activeSessions.size).toBe(0);
  });
  
  it('should execute work within a session', async () => {
    let sessionInsideWork: any;
    
    const result = await sessionManager.withSession(async (session) => {
      sessionInsideWork = session;
      
      // Run a simple query to test the session
      const queryResult = await session.run('RETURN 1 as num');
      expect(queryResult.records[0].get('num').toNumber()).toBe(1);
      
      return 'test-result';
    });
    
    expect(result).toBe('test-result');
    expect(sessionInsideWork).toBeDefined();
    
    // Session should be closed after work completes
    // @ts-ignore - Accessing private property for testing
    expect(sessionManager.activeSessions.size).toBe(0);
  });
  
  it('should close all active sessions', async () => {
    // Create multiple sessions
    const session1 = sessionManager.getSession();
    const session2 = sessionManager.getSession();
    const session3 = sessionManager.getSession();
    
    // @ts-ignore - Accessing private property for testing
    expect(sessionManager.activeSessions.size).toBe(3);
    
    // Close all sessions
    await sessionManager.closeAll();
    
    // @ts-ignore - Accessing private property for testing
    expect(sessionManager.activeSessions.size).toBe(0);
    
    // Sessions should be closed
    await expect(session1.run('RETURN 1')).rejects.toThrow();
  });
  
  it('should run a query in a new session', async () => {
    const result = await sessionManager.run('RETURN 1 + 2 as sum');
    
    expect(result.records).toHaveLength(1);
    expect(result.records[0].get('sum').toNumber()).toBe(3);
    
    // Session should be closed after query
    // @ts-ignore - Accessing private property for testing
    expect(sessionManager.activeSessions.size).toBe(0);
  });
});