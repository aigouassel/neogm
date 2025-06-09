import { ConnectionManager } from './connection';
import { Node } from './node';
import { Relationship } from './relationship';
import { QueryBuilder, RawQuery } from './query-builder';
import { NeoGMConfig, TransactionFunction } from './types';

export class NeoGM {
  private connectionManager: ConnectionManager;

  constructor(config: NeoGMConfig) {
    this.connectionManager = new ConnectionManager(config);
  }

  async connect(): Promise<void> {
    await this.connectionManager.connect();
  }

  async disconnect(): Promise<void> {
    await this.connectionManager.disconnect();
  }

  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  createNode(label: string, properties: Record<string, any> = {}): Node {
    return new Node(label, properties, this.connectionManager);
  }

  createRelationship(
    type: string, 
    startNode: Node, 
    endNode: Node, 
    properties: Record<string, any> = {}
  ): Relationship {
    return new Relationship(type, startNode, endNode, properties, this.connectionManager);
  }

  queryBuilder(): QueryBuilder {
    return QueryBuilder.create(this.connectionManager);
  }

  rawQuery(): RawQuery {
    return new RawQuery(this.connectionManager);
  }

  async findNodeById(id: string | number, label: string): Promise<Node | null> {
    return Node.findById(id, label, this.connectionManager);
  }

  async findNodes(label: string, where?: Record<string, any>, options?: { limit?: number; skip?: number; orderBy?: string }): Promise<Node[]> {
    return Node.findAll(label, this.connectionManager, { where: where as any, ...options });
  }

  async findOneNode(label: string, where: Record<string, any>): Promise<Node | null> {
    return Node.findOne(label, where, this.connectionManager);
  }

  async findRelationshipById(id: string | number, type: string): Promise<Relationship | null> {
    return Relationship.findById(id, type, this.connectionManager);
  }

  async findRelationships(type: string, where?: Record<string, any>, options?: { limit?: number; skip?: number; orderBy?: string }): Promise<Relationship[]> {
    return Relationship.findAll(type, this.connectionManager, { where: where as any, ...options });
  }

  async findRelationshipsBetweenNodes(startNodeId: string | number, endNodeId: string | number, type: string): Promise<Relationship[]> {
    return Relationship.findBetweenNodes(startNodeId, endNodeId, type, this.connectionManager);
  }

  async executeInTransaction<T>(fn: TransactionFunction<T>): Promise<T> {
    const session = this.connectionManager.getSession();
    
    try {
      return await session.executeWrite(fn);
    } finally {
      await session.close();
    }
  }

  async executeReadTransaction<T>(fn: TransactionFunction<T>): Promise<T> {
    const session = this.connectionManager.getSession();
    
    try {
      return await session.executeRead(fn);
    } finally {
      await session.close();
    }
  }

  async clearDatabase(): Promise<void> {
    const session = this.connectionManager.getSession();
    
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
  }
}