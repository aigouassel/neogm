/**
 * Session manager for Neo4j database sessions
 */
import { Session, SessionMode, Result } from 'neo4j-driver';
/**
 * Options for session creation
 */
export interface SessionOptions {
    /** Database to connect to */
    database?: string;
    /** Session mode (read or write) */
    mode?: SessionMode;
    /** Booking keeping information for logging */
    bookmarks?: string[];
    /** Whether to fetch bookmarks after commit */
    fetchBookmarks?: boolean;
}
/**
 * Function type for session work
 */
export type SessionWork<T> = (session: Session) => Promise<T>;
/**
 * Manages Neo4j session lifecycle
 */
export declare class SessionManager {
    private static instance;
    private connectionManager;
    private activeSessions;
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor();
    /**
     * Get the singleton instance of the session manager
     */
    static getInstance(): SessionManager;
    /**
     * Get a new session
     * @param options Session options
     * @returns Neo4j session
     */
    getSession(options?: SessionOptions): Session;
    /**
     * Execute work within a session and automatically close it afterward
     * @param work Function that will use the session
     * @param options Session options
     * @returns Result of the work function
     */
    withSession<T>(work: SessionWork<T>, options?: SessionOptions): Promise<T>;
    /**
     * Run a query in a new session
     * @param query Cypher query string
     * @param params Query parameters
     * @param options Session options
     * @returns Query result
     */
    run(query: string, params?: Record<string, any>, options?: SessionOptions): Promise<Result>;
    /**
     * Close all active sessions
     * @returns Promise that resolves when all sessions are closed
     */
    closeAll(): Promise<void>;
}
//# sourceMappingURL=session-manager.d.ts.map