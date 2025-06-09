import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import { NeoGMConfig } from './types';

export class ConnectionManager {
  private driver: Driver | null = null;
  private config: NeoGMConfig;

  constructor(config: NeoGMConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.driver) {
      return;
    }

    this.driver = neo4j.driver(
      this.config.uri,
      auth.basic(this.config.user, this.config.password)
    );

    try {
      await this.driver.verifyConnectivity();
    } catch (error) {
      await this.driver.close();
      this.driver = null;
      throw new Error(`Failed to connect to Neo4j: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Connection not established. Call connect() first.');
    }

    const sessionConfig = this.config.database 
      ? { database: this.config.database }
      : {};

    return this.driver.session(sessionConfig);
  }

  getDriver(): Driver {
    if (!this.driver) {
      throw new Error('Connection not established. Call connect() first.');
    }
    return this.driver;
  }

  isConnected(): boolean {
    return this.driver !== null;
  }
}