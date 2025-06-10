import { ConnectionManager } from '../connection';
import { MetadataStorage } from '../decorators/metadata';
import { NodeMetadata } from '../decorators/types';
import { BaseEntity } from './base-entity';

export class Repository<T extends BaseEntity> {
  constructor(
    private entityClass: new (...args: any[]) => T,
    private connectionManager: ConnectionManager
  ) {}

  async findById(id: string | number): Promise<T | null> {
    const session = this.connectionManager.getSession();
    
    try {
      const metadata = this.getMetadata();
      const query = `MATCH (n:${metadata.label}) WHERE ID(n) = $id RETURN n`;
      const result = await session.run(query, { id });
      
      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const nodeData = record.get('n');
      
      return this.createEntityFromNode(nodeData);
    } finally {
      await session.close();
    }
  }

  async findOne(where: Record<string, any>): Promise<T | null> {
    const results = await this.find({ where, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async find(options?: {
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    skip?: number;
  }): Promise<T[]> {
    const session = this.connectionManager.getSession();
    
    try {
      const metadata = this.getMetadata();
      let query = `MATCH (n:${metadata.label})`;
      const parameters: any = {};

      if (options?.where) {
        const whereConditions = Object.keys(options.where).map(key => {
          parameters[key] = options.where![key];
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
        return this.createEntityFromNode(nodeData);
      });
    } finally {
      await session.close();
    }
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.entityClass();
    entity.setConnectionManager(this.connectionManager);
    
    // Set properties from data
    Object.assign(entity, data);
    
    return entity;
  }

  async save(entity: T): Promise<T> {
    if (!entity.getConnectionManager()) {
      entity.setConnectionManager(this.connectionManager);
    }
    return await entity.save();
  }

  async delete(entity: T): Promise<boolean> {
    return await entity.delete();
  }

  async count(where?: Record<string, any>): Promise<number> {
    const session = this.connectionManager.getSession();
    
    try {
      const metadata = this.getMetadata();
      let query = `MATCH (n:${metadata.label})`;
      const parameters: any = {};

      if (where) {
        const whereConditions = Object.keys(where).map(key => {
          parameters[key] = where[key];
          return `n.${key} = $${key}`;
        });
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += ` RETURN count(n) as total`;

      const result = await session.run(query, parameters);
      return result.records[0]?.get('total').toNumber() || 0;
    } finally {
      await session.close();
    }
  }

  async exists(where: Record<string, any>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  private getMetadata(): NodeMetadata {
    const metadata = MetadataStorage.getInstance().getNodeMetadata(this.entityClass);
    if (!metadata) {
      throw new Error(`No metadata found for ${this.entityClass.name}. Did you forget to add @Node decorator?`);
    }
    return metadata;
  }

  private createEntityFromNode(nodeData: any): T {
    const entity = new this.entityClass();
    entity.setConnectionManager(this.connectionManager);
    entity.setId(nodeData.identity.toNumber());
    
    // Set properties from database
    const metadata = this.getMetadata();
    for (const [key, propertyMetadata] of metadata.properties) {
      const value = nodeData.properties[key];
      if (value !== undefined) {
        // Apply reverse transformer if defined
        const transformedValue = propertyMetadata.transformer?.from 
          ? propertyMetadata.transformer.from(value)
          : value;
        (entity as any)[key] = transformedValue;
      }
    }
    
    entity.markAsLoaded();
    return entity;
  }
}