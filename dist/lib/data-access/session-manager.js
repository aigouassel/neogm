"use strict";
/**
 * Session manager for Neo4j database sessions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const connection_manager_1 = require("./connection-manager");
/**
 * Manages Neo4j session lifecycle
 */
class SessionManager {
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.activeSessions = new Set();
        this.connectionManager = connection_manager_1.ConnectionManager.getInstance();
    }
    /**
     * Get the singleton instance of the session manager
     */
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    /**
     * Get a new session
     * @param options Session options
     * @returns Neo4j session
     */
    getSession(options = {}) {
        const { database, mode = neo4j_driver_1.default.session.WRITE } = options;
        // Get session from the connection manager
        const session = database
            ? this.connectionManager.getSessionForDatabase(database, mode)
            : this.connectionManager.getSession(mode);
        // Track the active session
        this.activeSessions.add(session);
        // Remove from tracking when closed
        const originalClose = session.close.bind(session);
        session.close = async () => {
            this.activeSessions.delete(session);
            return originalClose();
        };
        return session;
    }
    /**
     * Execute work within a session and automatically close it afterward
     * @param work Function that will use the session
     * @param options Session options
     * @returns Result of the work function
     */
    async withSession(work, options = {}) {
        const session = this.getSession(options);
        try {
            // Execute the work
            return await work(session);
        }
        finally {
            // Always close the session
            await session.close();
        }
    }
    /**
     * Run a query in a new session
     * @param query Cypher query string
     * @param params Query parameters
     * @param options Session options
     * @returns Query result
     */
    async run(query, params = {}, options = {}) {
        return this.withSession(async (session) => {
            return session.run(query, params);
        }, options);
    }
    /**
     * Close all active sessions
     * @returns Promise that resolves when all sessions are closed
     */
    async closeAll() {
        const closePromises = [];
        // Close each active session
        for (const session of this.activeSessions) {
            closePromises.push(session.close());
        }
        // Wait for all sessions to close
        await Promise.all(closePromises);
        // Clear the active sessions set
        this.activeSessions.clear();
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map