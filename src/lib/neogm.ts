import { ConnectionManager } from './connection';
import { QueryBuilder, RawQuery } from './query-builder';
import { NeoGMConfig, TransactionFunction } from './types';
import { BaseEntity, Repository } from './entity';

export class NeoGM {
  private connectionManager: ConnectionManager;
  private repositories = new Map<any, Repository<any>>();

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


  queryBuilder(): QueryBuilder {
    return QueryBuilder.create(this.connectionManager);
  }

  rawQuery(): RawQuery {
    return new RawQuery(this.connectionManager);
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

  getRepository<T extends BaseEntity>(entityClass: new (...args: any[]) => T): Repository<T> {
    if (!this.repositories.has(entityClass)) {
      const repository = new Repository(entityClass, this.connectionManager);
      this.repositories.set(entityClass, repository);
    }
    return this.repositories.get(entityClass);
  }

  createEntity<T extends BaseEntity>(entityClass: new (...args: any[]) => T, data?: Partial<T>): T {
    const entity = new entityClass();
    entity.setConnectionManager(this.connectionManager);
    if (data) {
      Object.assign(entity, data);
    }
    return entity;
  }
}