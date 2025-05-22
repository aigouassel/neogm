/**
 * Neo4j test container utilities
 * 
 * This utility manages a Docker-based Neo4j instance for integration tests.
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { ConnectionConfig, SingleDatabaseConfig } from '../../connection-config';
import * as path from 'path';

/**
 * Configuration for the Neo4j test container
 */
export interface Neo4jTestContainerConfig {
  /** Project root directory, used to locate docker-compose file */
  projectRoot: string;
  /** Docker-compose file name */
  composeFile: string;
  /** Neo4j connection configuration to use for tests */
  connectionConfig: SingleDatabaseConfig;
  /** Docker-compose service name */
  serviceName: string;
  /** Timeout for container startup in milliseconds */
  startupTimeout: number;
}

/**
 * Manages a Neo4j test container for integration tests
 */
export class Neo4jTestContainer {
  private config: Neo4jTestContainerConfig;
  private containerProcess: ChildProcess | null = null;
  private containerId: string | null = null;
  private neo4jDriver: any = null; // Will be initialized during start

  /**
   * Create a new Neo4j test container
   * @param config Test container configuration
   */
  constructor(config: Neo4jTestContainerConfig) {
    this.config = config;
  }

  /**
   * Start the Neo4j test container
   * @returns Connection configuration for the test container
   */
  async start(): Promise<ConnectionConfig> {
    const composePath = path.join(
      this.config.projectRoot || process.cwd(),
      this.config.composeFile || 'docker-compose.test.yml'
    );

    try {
      // Check if Docker is available
      execSync('docker --version', { stdio: 'ignore' });

      // Check if docker-compose is available
      execSync('docker-compose --version', { stdio: 'ignore' });

      // Start the container
      console.log('Starting Neo4j test container...');
      this.containerProcess = spawn('docker-compose', ['-f', composePath, 'up', '-d'], {
        stdio: 'inherit'
      });

      // Wait for container to be ready
      await this.waitForContainer();

      // Get the container ID
      this.containerId = execSync(`docker-compose -f ${composePath} ps -q ${this.config.serviceName}`)
        .toString()
        .trim();

      console.log(`Neo4j test container started with ID: ${this.containerId}`);

      // Initialize the Neo4j driver
      try {
        const neo4j = require('neo4j-driver');
        const { uri, auth } = this.config.connectionConfig;

        // Create auth object
        const authObj = auth
          ? neo4j.auth.basic(auth.username, auth.password, auth.realm)
          : undefined;

        // Create driver
        this.neo4jDriver = neo4j.driver(uri, authObj, {
          maxConnectionPoolSize: 50,
          maxConnectionLifetime: 3600000
        });

        console.log('Neo4j driver initialized');
      } catch (error) {
        console.error('Failed to initialize Neo4j driver:', error);
      }

      return this.config.connectionConfig as ConnectionConfig;
    } catch (error) {
      console.error('Failed to start Neo4j test container:', error);
      throw error;
    }
  }

  /**
   * Wait for the Neo4j container to be ready
   */
  private async waitForContainer(): Promise<void> {
    const startTime = Date.now();
    const timeout = this.config.startupTimeout || 30000;

    console.log('Waiting for Neo4j container to be healthy...');

    while (true) {
      try {
        // Check if container is healthy
        const status = execSync(
          `docker-compose -f ${path.join(
            this.config.projectRoot || process.cwd(),
            this.config.composeFile || 'docker-compose.test.yml'
          )} ps`
        ).toString();

        if (status.includes('healthy')) {
          console.log('Neo4j container is healthy!');
          return;
        }

        // Check if we've timed out
        if (Date.now() - startTime > timeout) {
          throw new Error(`Timed out waiting for Neo4j container to start after ${timeout}ms`);
        }

        // Wait a bit before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Stop the Neo4j test container
   */
  async stop(): Promise<void> {
    // Close the driver if it exists
    if (this.neo4jDriver) {
      try {
        await this.neo4jDriver.close();
        console.log('Neo4j driver closed');
      } catch (error) {
        console.error('Error closing Neo4j driver:', error);
      }
      this.neo4jDriver = null;
    }

    if (!this.containerId) {
      console.log('No Neo4j test container to stop');
      return;
    }

    try {
      console.log('Stopping Neo4j test container...');

      const composePath = path.join(
        this.config.projectRoot || process.cwd(),
        this.config.composeFile || 'docker-compose.test.yml'
      );

      execSync(`docker-compose -f ${composePath} down -v`, { stdio: 'inherit' });

      console.log('Neo4j test container stopped');

      this.containerId = null;
    } catch (error) {
      console.error('Failed to stop Neo4j test container:', error);
      throw error;
    }
  }

  /**
   * Get the connection configuration for the test container
   */
  getConnectionConfig(): ConnectionConfig {
    return this.config.connectionConfig as ConnectionConfig;
  }

  // Multi-database functionality is not implemented since it requires
  // paid Neo4j versions. Tests will use the default 'neo4j' database only.
}