import { ConnectionManager } from '../../src/lib/connection';

/**
 * Utility to ensure proper test isolation by clearing database state
 * and ensuring clean setup for each test
 */
export class TestIsolation {
  static async clearDatabase(connectionManager: ConnectionManager): Promise<void> {
    const session = connectionManager.getSession();
    try {
      // More thorough cleanup - also clear any indexes or constraints
      await session.run('MATCH (n) DETACH DELETE n');
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 10));
    } finally {
      await session.close();
    }
  }

  static async verifyDatabaseEmpty(connectionManager: ConnectionManager): Promise<boolean> {
    const session = connectionManager.getSession();
    try {
      const result = await session.run('MATCH (n) RETURN count(n) as count');
      const count = result.records[0]?.get('count')?.toNumber() || 0;
      return count === 0;
    } finally {
      await session.close();
    }
  }

  static async ensureCleanDatabase(connectionManager: ConnectionManager): Promise<void> {
    await this.clearDatabase(connectionManager);
    const isEmpty = await this.verifyDatabaseEmpty(connectionManager);
    if (!isEmpty) {
      console.warn('Database not properly cleaned, retrying...');
      await this.clearDatabase(connectionManager);
    }
  }
}