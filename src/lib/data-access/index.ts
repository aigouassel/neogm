/**
 * Data Access Layer for Neo4j - exports the core components
 */

export * from './connection-config';
export * from './connection-manager';
export * from './session-manager';
export * from './query-runner';

// Re-export Neo4j driver types
import neo4j from 'neo4j-driver';
export const Neo4j = neo4j;

// Convenience access to manager instances
import { ConnectionManager } from './connection-manager';
import { SessionManager } from './session-manager';
import { QueryRunner } from './query-runner';
import { ConnectionConfig } from './connection-config';

/**
 * Initialize the Neo4j connection
 * @param config Neo4j connection configuration
 */
export function initNeo4j(config: ConnectionConfig): void {
  ConnectionManager.getInstance().init(config);
}

/**
 * Get the connection manager instance
 */
export function getConnectionManager(): ConnectionManager {
  return ConnectionManager.getInstance();
}

/**
 * Get the session manager instance
 */
export function getSessionManager(): SessionManager {
  return SessionManager.getInstance();
}

/**
 * Get the query runner instance
 */
export function getQueryRunner(): QueryRunner {
  return QueryRunner.getInstance();
}

/**
 * Run a direct query against Neo4j
 * @param query Cypher query string
 * @param params Query parameters
 * @returns Query result
 */
export function runQuery<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
  return QueryRunner.getInstance().run<T>(query, params);
}

/**
 * Clean up all Neo4j connections and sessions
 */
export async function closeNeo4j(): Promise<void> {
  // Close all active sessions first
  await SessionManager.getInstance().closeAll();
  
  // Then close all drivers
  await ConnectionManager.getInstance().closeAll();
}