/**
 * Connection configuration types and interfaces for Neo4j connections
 */

import { Config as Neo4jConfig } from 'neo4j-driver';

/**
 * Authentication configuration for Neo4j
 */
export interface AuthConfig {
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
  /** Optional realm for authentication */
  realm?: string;
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  /** Maximum number of connections in the pool */
  maxSize?: number;
  /** Maximum amount of time to keep an idle connection in the pool (ms) */
  maxConnectionLifetime?: number;
  /** Maximum amount of time to wait for a connection before timing out (ms) */
  connectionAcquisitionTimeout?: number;
}

/**
 * Database specific configuration
 */
export interface DatabaseConfig {
  /** The name of the database to connect to */
  name: string;
  /** The URI of the database */
  uri: string;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Connection pool configuration */
  pool?: ConnectionPoolConfig;
  /** Additional Neo4j driver configuration */
  driverConfig?: Neo4jConfig;
}

/**
 * Multi-database configuration
 */
export interface MultiDatabaseConfig {
  /** The default database to use when no specific database is specified */
  default: string;
  /** Map of database names to their configurations */
  databases: Record<string, DatabaseConfig>;
}

/**
 * Single connection string configuration
 */
export type ConnectionStringConfig = string;

/**
 * Single database connection configuration
 */
export interface SingleDatabaseConfig {
  /** The URI of the database */
  uri: string;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Connection pool configuration */
  pool?: ConnectionPoolConfig;
  /** Additional Neo4j driver configuration */
  driverConfig?: Neo4jConfig;
}

/**
 * Union type for all possible connection configurations
 */
export type ConnectionConfig = 
  | ConnectionStringConfig 
  | SingleDatabaseConfig 
  | MultiDatabaseConfig;

/**
 * Resolves a connection config to a normalized format
 * @param config The connection configuration to normalize
 * @returns Normalized configuration
 */
export function normalizeConfig(config: ConnectionConfig): MultiDatabaseConfig {
  // If config is a string, convert to SingleDatabaseConfig
  if (typeof config === 'string') {
    return {
      default: 'default',
      databases: {
        default: {
          name: 'default',
          uri: config,
          auth: {
            username: 'neo4j',
            password: 'neo4j'
          }
        }
      }
    };
  }
  
  // If config is a SingleDatabaseConfig, convert to MultiDatabaseConfig
  if ('uri' in config) {
    return {
      default: 'default',
      databases: {
        default: {
          name: 'default',
          ...config
        }
      }
    };
  }
  
  // Config is already a MultiDatabaseConfig
  return config;
}