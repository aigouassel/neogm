import { NodeProperties, NodeDefinition, QueryOptions } from './types';
import { ConnectionManager } from './connection';

export class Node {
  private label: string;
  private properties: NodeProperties;
  private id?: string | number;
  private connectionManager: ConnectionManager;

  constructor(label: string, properties: NodeProperties = {}, connectionManager: ConnectionManager) {
    this.label = label;
    this.properties = properties;
    this.connectionManager = connectionManager;
  }

  setId(id: string | number): void {
    this.id = id;
  }

  getId(): string | number | undefined {
    return this.id;
  }

  getLabel(): string {
    return this.label;
  }

  getProperties(): NodeProperties {
    return { ...this.properties };
  }

  setProperty(key: string, value: any): void {
    this.properties[key] = value;
  }

  getProperty(key: string): any {
    return this.properties[key];
  }

  async save(): Promise<Node> {
    const session = this.connectionManager.getSession();
    
    try {
      const propsString = Object.keys(this.properties).length > 0 
        ? `{${Object.keys(this.properties).map(key => `${key}: $${key}`).join(', ')}}`
        : '';
      
      let query: string;
      let parameters = { ...this.properties };

      if (this.id) {
        query = `MATCH (n:${this.label}) WHERE ID(n) = $id SET n += $props RETURN n`;
        parameters.id = this.id;
        parameters.props = this.properties;
      } else {
        query = `CREATE (n:${this.label} ${propsString}) RETURN n`;
      }

      const result = await session.run(query, parameters);
      
      if (result.records.length > 0) {
        const record = result.records[0];
        const node = record.get('n');
        this.id = node.identity.toNumber();
        this.properties = node.properties;
      }

      return this;
    } finally {
      await session.close();
    }
  }

  async delete(): Promise<boolean> {
    if (!this.id) {
      throw new Error('Cannot delete node without ID');
    }

    const session = this.connectionManager.getSession();
    
    try {
      const query = `MATCH (n:${this.label}) WHERE ID(n) = $id DELETE n RETURN count(n) as deleted`;
      const result = await session.run(query, { id: this.id });
      
      return (result.records[0]?.get('deleted') as any)?.toNumber() > 0;
    } finally {
      await session.close();
    }
  }

  static async findById(id: string | number, label: string, connectionManager: ConnectionManager): Promise<Node | null> {
    const session = connectionManager.getSession();
    
    try {
      const query = `MATCH (n:${label}) WHERE ID(n) = $id RETURN n`;
      const result = await session.run(query, { id });
      
      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const nodeData = record.get('n');
      
      const node = new Node(label, nodeData.properties, connectionManager);
      node.setId(nodeData.identity.toNumber());
      
      return node;
    } finally {
      await session.close();
    }
  }

  static async findAll(label: string, connectionManager: ConnectionManager, options?: QueryOptions): Promise<Node[]> {
    const session = connectionManager.getSession();
    
    try {
      let query = `MATCH (n:${label})`;
      const parameters: any = {};

      if (options?.where) {
        const whereConditions = Object.keys(options.where).map(key => {
          parameters[key] = (options.where as any)[key];
          return `n.${key} = $${key}`;
        });
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` RETURN n`;

      if (options?.orderBy) {
        query += ` ORDER BY n.${options.orderBy}`;
      }

      if (options?.skip) {
        query += ` SKIP ${options.skip}`;
      }

      if (options?.limit) {
        query += ` LIMIT ${options.limit}`;
      }

      const result = await session.run(query, parameters);
      
      return result.records.map(record => {
        const nodeData = record.get('n');
        const node = new Node(label, nodeData.properties, connectionManager);
        node.setId(nodeData.identity.toNumber());
        return node;
      });
    } finally {
      await session.close();
    }
  }

  static async findOne(label: string, where: Record<string, any>, connectionManager: ConnectionManager): Promise<Node | null> {
    const results = await Node.findAll(label, connectionManager, { where: where as any, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  toJSON(): NodeDefinition {
    return {
      label: this.label,
      properties: this.properties,
      id: this.id
    };
  }
}