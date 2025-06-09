import { ConnectionManager } from '../../src/lib/connection';
import { testConfig } from '../setup/test-config';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    connectionManager = new ConnectionManager(testConfig);
  });

  afterEach(async () => {
    if (connectionManager.isConnected()) {
      await connectionManager.disconnect();
    }
  });

  describe('connect', () => {
    it('should successfully connect to Neo4j', async () => {
      await connectionManager.connect();
      expect(connectionManager.isConnected()).toBe(true);
    });

    it('should not create multiple connections when called multiple times', async () => {
      await connectionManager.connect();
      await connectionManager.connect();
      expect(connectionManager.isConnected()).toBe(true);
    });

    it('should throw error on invalid connection', async () => {
      const invalidConfig = { ...testConfig, password: 'invalid' };
      const invalidConnectionManager = new ConnectionManager(invalidConfig);
      
      await expect(invalidConnectionManager.connect()).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await connectionManager.connect();
      await connectionManager.disconnect();
      expect(connectionManager.isConnected()).toBe(false);
    });

    it('should handle disconnect when not connected', async () => {
      await expect(connectionManager.disconnect()).resolves.not.toThrow();
    });
  });

  describe('getSession', () => {
    it('should return a session when connected', async () => {
      await connectionManager.connect();
      const session = connectionManager.getSession();
      expect(session).toBeDefined();
      await session.close();
    });

    it('should throw error when not connected', () => {
      expect(() => connectionManager.getSession()).toThrow('Connection not established');
    });
  });

  describe('getDriver', () => {
    it('should return driver when connected', async () => {
      await connectionManager.connect();
      const driver = connectionManager.getDriver();
      expect(driver).toBeDefined();
    });

    it('should throw error when not connected', () => {
      expect(() => connectionManager.getDriver()).toThrow('Connection not established');
    });
  });
});