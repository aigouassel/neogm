/**
 * Helper class for working with multiple database connections
 * 
 * This class demonstrates how to work with multiple Neo4j database connections
 * using the NeoGM connection management utilities.
 */

import { 
  ConnectionManager, 
  SessionManager,
  QueryRunner,
  ConnectionConfig
} from '../../index';

/**
 * Demonstrates handling of multiple database connections
 */
export class MultiConnectionHelper {
  private connectionManager: ConnectionManager;
  private sessionManager: SessionManager;
  private queryRunner: QueryRunner;
  
  /**
   * Create a new multi-connection helper
   */
  constructor() {
    this.connectionManager = ConnectionManager.getInstance();
    this.sessionManager = SessionManager.getInstance();
    this.queryRunner = QueryRunner.getInstance();
  }
  
  /**
   * Initialize with a multi-database configuration
   * @param config Multi-database configuration
   */
  initialize(config: ConnectionConfig): void {
    // First close any existing connections
    this.closeConnections();
    
    // Initialize with new config
    this.connectionManager.init(config);
  }
  
  /**
   * Close all database connections
   */
  async closeConnections(): Promise<void> {
    await this.connectionManager.closeAll();
  }
  
  /**
   * Execute a query on the default database
   * @param query Cypher query
   * @param params Query parameters
   * @returns Query results
   */
  async queryDefaultDatabase<T>(query: string, params: Record<string, any> = {}): Promise<T[]> {
    return this.queryRunner.run<T>(query, params);
  }
  
  /**
   * Execute a query on a specific database
   * @param database Database name
   * @param query Cypher query
   * @param params Query parameters
   * @returns Query results
   */
  async queryDatabase<T>(
    database: string, 
    query: string, 
    params: Record<string, any> = {}
  ): Promise<T[]> {
    return this.queryRunner.run<T>(query, params, undefined, { database });
  }
  
  /**
   * Create test data in multiple databases
   * @param databases Array of database names
   * @param createQuery Query to create data (should be identical for all databases)
   * @param params Query parameters
   */
  async createTestDataInDatabases(
    databases: string[],
    createQuery: string,
    params: Record<string, any> = {}
  ): Promise<void> {
    for (const database of databases) {
      await this.sessionManager.run(createQuery, params, { database });
    }
  }
  
  /**
   * Verify data isolation between databases
   * @param databases Array of database names
   * @param findQuery Query to find data
   * @param params Query parameters
   * @returns Object mapping database names to boolean indicating data presence
   */
  async verifyDataIsolation(
    databases: string[],
    findQuery: string,
    params: Record<string, any> = {}
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const database of databases) {
      try {
        const queryResult = await this.sessionManager.run(findQuery, params, { database });
        results[database] = queryResult.records.length > 0;
      } catch (error) {
        results[database] = false;
      }
    }
    
    return results;
  }
  
  /**
   * Execute work across multiple databases
   * @param databases Array of database names
   * @param work Function that takes a database name and performs work
   * @returns Array of results from each database
   */
  async executeAcrossDatabases<T>(
    databases: string[],
    work: (database: string) => Promise<T>
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    
    for (const database of databases) {
      try {
        results[database] = await work(database);
      } catch (error) {
        console.error(`Error executing work on database ${database}:`, error);
        throw error;
      }
    }
    
    return results;
  }
  
  /**
   * Get the current databases supported by the configuration
   * @returns Array of database names
   */
  getDatabases(): string[] {
    // @ts-ignore - Accessing private property for demonstration
    if (!this.connectionManager.initialized || !this.connectionManager.config) {
      return [];
    }
    
    // @ts-ignore - Accessing private property for demonstration
    return Object.keys(this.connectionManager.config.databases || {});
  }
  
  /**
   * Get the default database name
   * @returns Default database name
   */
  getDefaultDatabase(): string {
    // @ts-ignore - Accessing private property for demonstration
    return this.connectionManager.defaultDatabase;
  }
}