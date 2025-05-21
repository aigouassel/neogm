/**
 * Connection manager for Neo4j database connections
 */

import neo4j, { Driver, Session, SessionMode } from 'neo4j-driver';
import { 
  ConnectionConfig, 
  MultiDatabaseConfig, 
  DatabaseConfig,
  normalizeConfig
} from './connection-config';

/**
 * Manages Neo4j database connections
 */
export class ConnectionManager {
  private static instance: ConnectionManager;
  private drivers: Map<string, Driver> = new Map();
  private config: MultiDatabaseConfig;
  private defaultDatabase: string;
  private isInitialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of the connection manager
   */
  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Initialize the connection manager with configuration
   * @param config Connection configuration
   */
  public init(config: ConnectionConfig): void {
    if (this.isInitialized) {
      throw new Error('ConnectionManager is already initialized');
    }

    this.config = normalizeConfig(config);
    this.defaultDatabase = this.config.default;
    this.isInitialized = true;
  }

  /**
   * Get the default driver
   * @returns Neo4j driver instance
   */
  public getDriver(): Driver {
    return this.getDriverForDatabase(this.defaultDatabase);
  }

  /**
   * Get a driver for a specific database
   * @param database Database name
   * @returns Neo4j driver instance
   */
  public getDriverForDatabase(database: string): Driver {
    this.ensureInitialized();

    // Check if driver already exists
    if (this.drivers.has(database)) {
      return this.drivers.get(database)!;
    }

    // Check if database exists in config
    if (!this.config.databases[database]) {
      throw new Error(`Database configuration not found for: ${database}`);
    }

    // Create a new driver
    const dbConfig = this.config.databases[database];
    const driver = this.createDriver(dbConfig);
    this.drivers.set(database, driver);

    return driver;
  }

  /**
   * Create a new Neo4j driver instance
   * @param config Database configuration
   * @returns Neo4j driver instance
   */
  private createDriver(config: DatabaseConfig): Driver {
    const { uri, auth, driverConfig } = config;
    
    // Create authentication object
    const authObj = auth 
      ? neo4j.auth.basic(auth.username, auth.password, auth.realm) 
      : undefined;
    
    // Create driver with configuration
    return neo4j.driver(uri, authObj, {
      // Default connection pool settings
      maxConnectionPoolSize: config.pool?.maxSize || 100,
      maxConnectionLifetime: config.pool?.maxConnectionLifetime || 3600000,
      connectionAcquisitionTimeout: config.pool?.connectionAcquisitionTimeout || 60000,
      // Override with custom driver config if provided
      ...driverConfig
    });
  }

  /**
   * Get a session from the default database
   * @param mode Session mode (read or write)
   * @returns Neo4j session
   */
  public getSession(mode: SessionMode = neo4j.session.WRITE): Session {
    return this.getSessionForDatabase(this.defaultDatabase, mode);
  }

  /**
   * Get a session for a specific database
   * @param database Database name
   * @param mode Session mode (read or write)
   * @returns Neo4j session
   */
  public getSessionForDatabase(database: string, mode: SessionMode = neo4j.session.WRITE): Session {
    const driver = this.getDriverForDatabase(database);
    return driver.session({ defaultAccessMode: mode });
  }

  /**
   * Ensure the connection manager is initialized
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ConnectionManager is not initialized. Call init() first.');
    }
  }

  /**
   * Close all driver connections
   * @returns Promise that resolves when all connections are closed
   */
  public async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    // Close each driver
    for (const driver of this.drivers.values()) {
      closePromises.push(driver.close());
    }
    
    // Wait for all drivers to close
    await Promise.all(closePromises);
    
    // Clear the drivers map
    this.drivers.clear();
    this.isInitialized = false;
  }
}