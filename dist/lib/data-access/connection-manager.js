"use strict";
/**
 * Connection manager for Neo4j database connections
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const connection_config_1 = require("./connection-config");
/**
 * Manages Neo4j database connections
 */
class ConnectionManager {
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.drivers = new Map();
        this.isInitialized = false;
    }
    /**
     * Get the singleton instance of the connection manager
     */
    static getInstance() {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }
    /**
     * Initialize the connection manager with configuration
     * @param config Connection configuration
     */
    init(config) {
        if (this.isInitialized) {
            throw new Error('ConnectionManager is already initialized');
        }
        this.config = (0, connection_config_1.normalizeConfig)(config);
        this.defaultDatabase = this.config.default;
        this.isInitialized = true;
    }
    /**
     * Get the default driver
     * @returns Neo4j driver instance
     */
    getDriver() {
        return this.getDriverForDatabase(this.defaultDatabase);
    }
    /**
     * Get a driver for a specific database
     * @param database Database name
     * @returns Neo4j driver instance
     */
    getDriverForDatabase(database) {
        this.ensureInitialized();
        // Check if driver already exists
        if (this.drivers.has(database)) {
            return this.drivers.get(database);
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
    createDriver(config) {
        const { uri, auth, driverConfig } = config;
        // Create authentication object
        const authObj = auth
            ? neo4j_driver_1.default.auth.basic(auth.username, auth.password, auth.realm)
            : undefined;
        // Create driver with configuration
        return neo4j_driver_1.default.driver(uri, authObj, {
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
    getSession(mode = neo4j_driver_1.default.session.WRITE) {
        return this.getSessionForDatabase(this.defaultDatabase, mode);
    }
    /**
     * Get a session for a specific database
     * @param database Database name
     * @param mode Session mode (read or write)
     * @returns Neo4j session
     */
    getSessionForDatabase(database, mode = neo4j_driver_1.default.session.WRITE) {
        const driver = this.getDriverForDatabase(database);
        return driver.session({ defaultAccessMode: mode });
    }
    /**
     * Ensure the connection manager is initialized
     * @throws Error if not initialized
     */
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new Error('ConnectionManager is not initialized. Call init() first.');
        }
    }
    /**
     * Close all driver connections
     * @returns Promise that resolves when all connections are closed
     */
    async closeAll() {
        const closePromises = [];
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
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=connection-manager.js.map