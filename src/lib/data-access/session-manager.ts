/**
 * Session manager for Neo4j database sessions
 */

import { Session, SessionMode, Result } from 'neo4j-driver';
import neo4j from 'neo4j-driver';
import { ConnectionManager } from './connection-manager';

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
export class SessionManager {
  private static instance: SessionManager;
  private connectionManager: ConnectionManager;
  private activeSessions: Set<Session> = new Set();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.connectionManager = ConnectionManager.getInstance();
  }

  /**
   * Get the singleton instance of the session manager
   */
  public static getInstance(): SessionManager {
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
  public getSession(options: SessionOptions = {}): Session {
    const { database, mode = neo4j.session.WRITE } = options;
    
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
  public async withSession<T>(work: SessionWork<T>, options: SessionOptions = {}): Promise<T> {
    const session = this.getSession(options);
    
    try {
      // Execute the work
      return await work(session);
    } finally {
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
  public async run(query: string, params: Record<string, any> = {}, options: SessionOptions = {}): Promise<Result> {
    return this.withSession(async (session) => {
      return session.run(query, params);
    }, options);
  }

  /**
   * Close all active sessions
   * @returns Promise that resolves when all sessions are closed
   */
  public async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
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