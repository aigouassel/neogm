import { QueryBuilder, RawQuery } from './query-builder';
import { NeoGMConfig, TransactionFunction } from './types';
import { BaseEntity, Repository } from './entity';
export declare class NeoGM {
    private connectionManager;
    private repositories;
    constructor(config: NeoGMConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    queryBuilder(): QueryBuilder;
    rawQuery(): RawQuery;
    executeInTransaction<T>(fn: TransactionFunction<T>): Promise<T>;
    executeReadTransaction<T>(fn: TransactionFunction<T>): Promise<T>;
    clearDatabase(): Promise<void>;
    getRepository<T extends BaseEntity>(entityClass: new (...args: any[]) => T): Repository<T>;
    createEntity<T extends BaseEntity>(entityClass: new (...args: any[]) => T, data?: Partial<T>): T;
}
//# sourceMappingURL=neogm.d.ts.map