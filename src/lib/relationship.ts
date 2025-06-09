import { RelationshipProperties, RelationshipDefinition, QueryOptions } from './types';
import { ConnectionManager } from './connection';
import { Node } from './node';

export class Relationship {
  private type: string;
  private properties: RelationshipProperties;
  private startNode: Node;
  private endNode: Node;
  private id?: string | number;
  private connectionManager: ConnectionManager;

  constructor(
    type: string, 
    startNode: Node, 
    endNode: Node, 
    properties: RelationshipProperties = {},
    connectionManager: ConnectionManager
  ) {
    this.type = type;
    this.startNode = startNode;
    this.endNode = endNode;
    this.properties = properties;
    this.connectionManager = connectionManager;
  }

  setId(id: string | number): void {
    this.id = id;
  }

  getId(): string | number | undefined {
    return this.id;
  }

  getType(): string {
    return this.type;
  }

  getProperties(): RelationshipProperties {
    return { ...this.properties };
  }

  setProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  getProperty(key: string): any {
    return this.properties[key];
  }

  getStartNode(): Node {
    return this.startNode;
  }

  getEndNode(): Node {
    return this.endNode;
  }

  async save(): Promise<Relationship> {
    const session = this.connectionManager.getSession();
    
    try {
      const startNodeId = this.startNode.getId();
      const endNodeId = this.endNode.getId();

      if (!startNodeId || !endNodeId) {
        throw new Error('Both start and end nodes must be saved before creating relationship');
      }

      const propsString = Object.keys(this.properties).length > 0 
        ? `{${Object.keys(this.properties).map(key => `${key}: $${key}`).join(', ')}}`
        : '';
      
      let query: string;
      let parameters: any = { ...this.properties, startId: startNodeId, endId: endNodeId };

      if (this.id) {
        query = `
          MATCH ()-[r:${this.type}]->() 
          WHERE ID(r) = $id 
          SET r += $props 
          RETURN r
        `;
        parameters.id = this.id;
        parameters.props = this.properties;
      } else {
        query = `
          MATCH (start), (end) 
          WHERE ID(start) = $startId AND ID(end) = $endId 
          CREATE (start)-[r:${this.type} ${propsString}]->(end) 
          RETURN r
        `;
      }

      const result = await session.run(query, parameters);
      
      if (result.records.length > 0) {
        const record = result.records[0];
        const rel = record.get('r');
        this.id = rel.identity.toNumber();
        this.properties = rel.properties;
      }

      return this;
    } finally {
      await session.close();
    }
  }

  async delete(): Promise<boolean> {
    if (!this.id) {
      throw new Error('Cannot delete relationship without ID');
    }

    const session = this.connectionManager.getSession();
    
    try {
      const query = `MATCH ()-[r:${this.type}]->() WHERE ID(r) = $id DELETE r RETURN count(r) as deleted`;
      const result = await session.run(query, { id: this.id });
      
      return (result.records[0]?.get('deleted') as any)?.toNumber() > 0;
    } finally {
      await session.close();
    }
  }

  static async findById(id: string | number, type: string, connectionManager: ConnectionManager): Promise<Relationship | null> {
    const session = connectionManager.getSession();
    
    try {
      const query = `
        MATCH (start)-[r:${type}]->(end) 
        WHERE ID(r) = $id 
        RETURN r, start, end
      `;
      const result = await session.run(query, { id });
      
      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const relData = record.get('r');
      const startData = record.get('start');
      const endData = record.get('end');
      
      const startNode = new Node(startData.labels[0], startData.properties, connectionManager);
      startNode.setId(startData.identity.toNumber());
      
      const endNode = new Node(endData.labels[0], endData.properties, connectionManager);
      endNode.setId(endData.identity.toNumber());
      
      const relationship = new Relationship(type, startNode, endNode, relData.properties, connectionManager);
      relationship.setId(relData.identity.toNumber());
      
      return relationship;
    } finally {
      await session.close();
    }
  }

  static async findAll(type: string, connectionManager: ConnectionManager, options?: QueryOptions): Promise<Relationship[]> {
    const session = connectionManager.getSession();
    
    try {
      let query = `MATCH (start)-[r:${type}]->(end)`;
      const parameters: any = {};

      if (options?.where) {
        const whereConditions = Object.keys(options.where).map(key => {
          parameters[key] = (options.where as any)[key];
          return `r.${key} = $${key}`;
        });
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` RETURN r, start, end`;

      if (options?.orderBy) {
        query += ` ORDER BY r.${options.orderBy}`;
      }

      if (options?.skip) {
        query += ` SKIP ${options.skip}`;
      }

      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;
      }

      const result = await session.run(query, parameters);
      
      return result.records.map(record => {
        const relData = record.get('r');
        const startData = record.get('start');
        const endData = record.get('end');
        
        const startNode = new Node(startData.labels[0], startData.properties, connectionManager);
        startNode.setId(startData.identity.toNumber());
        
        const endNode = new Node(endData.labels[0], endData.properties, connectionManager);
        endNode.setId(endData.identity.toNumber());
        
        const relationship = new Relationship(type, startNode, endNode, relData.properties, connectionManager);
        relationship.setId(relData.identity.toNumber());
        
        return relationship;
      });
    } finally {
      await session.close();
    }
  }

  static async findBetweenNodes(
    startNodeId: string | number, 
    endNodeId: string | number, 
    type: string, 
    connectionManager: ConnectionManager
  ): Promise<Relationship[]> {
    const session = connectionManager.getSession();
    
    try {
      const query = `
        MATCH (start)-[r:${type}]->(end) 
        WHERE ID(start) = $startId AND ID(end) = $endId 
        RETURN r, start, end
      `;
      const result = await session.run(query, { startId: startNodeId, endId: endNodeId });
      
      return result.records.map(record => {
        const relData = record.get('r');
        const startData = record.get('start');
        const endData = record.get('end');
        
        const startNode = new Node(startData.labels[0], startData.properties, connectionManager);
        startNode.setId(startData.identity.toNumber());
        
        const endNode = new Node(endData.labels[0], endData.properties, connectionManager);
        endNode.setId(endData.identity.toNumber());
        
        const relationship = new Relationship(type, startNode, endNode, relData.properties, connectionManager);
        relationship.setId(relData.identity.toNumber());
        
        return relationship;
      });
    } finally {
      await session.close();
    }
  }

  toJSON(): RelationshipDefinition {
    return {
      type: this.type,
      properties: this.properties,
      startNode: this.startNode.toJSON(),
      endNode: this.endNode.toJSON(),
      id: this.id
    };
  }
}