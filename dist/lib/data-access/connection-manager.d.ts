/**
 * Connection manager for Neo4j database connections
 */
import { Driver, Session, SessionMode } from 'neo4j-driver';
import { ConnectionConfig } from './connection-config';
/**
 * Manages Neo4j database connections
 */
export declare class ConnectionManager {
    private static instance;
    private drivers;
    private config;
    private defaultDatabase;
    private isInitialized;
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor();
    /**
     * Get the singleton instance of the connection manager
     */
    static getInstance(): ConnectionManager;
    /**
     * Initialize the connection manager with configuration
     * @param config Connection configuration
     */
    init(config: ConnectionConfig): void;
    /**
     * Get the default driver
     * @returns Neo4j driver instance
     */
    getDriver(): Driver;
    /**
     * Get a driver for a specific database
     * @param database Database name
     * @returns Neo4j driver instance
     */
    getDriverForDatabase(database: string): Driver;
    /**
     * Create a new Neo4j driver instance
     * @param config Database configuration
     * @returns Neo4j driver instance
     */
    private createDriver;
    /**
     * Get a session from the default database
     * @param mode Session mode (read or write)
     * @returns Neo4j session
     */
    getSession(mode?: SessionMode): Session;
    /**
     * Get a session for a specific database
     * @param database Database name
     * @param mode Session mode (read or write)
     * @returns Neo4j session
     */
    getSessionForDatabase(database: string, mode?: SessionMode): Session;
    /**
     * Ensure the connection manager is initialized
     * @throws Error if not initialized
     */
    private ensureInitialized;
    /**
     * Close all driver connections
     * @returns Promise that resolves when all connections are closed
     */
    closeAll(): Promise<void>;
}
//# sourceMappingURL=connection-manager.d.ts.map