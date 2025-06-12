import { ConnectionManager } from '../connection';
import { BaseEntity } from './base-entity';
export declare class Repository<T extends BaseEntity> {
    private entityClass;
    private connectionManager;
    constructor(entityClass: new (...args: any[]) => T, connectionManager: ConnectionManager);
    findById(id: string | number): Promise<T | null>;
    findOne(where: Record<string, any>): Promise<T | null>;
    find(options?: {
        where?: Record<string, any>;
        orderBy?: string;
        limit?: number;
        skip?: number;
    }): Promise<T[]>;
    create(data: Partial<T>): Promise<T>;
    save(entity: T): Promise<T>;
    delete(entity: T): Promise<boolean>;
    count(where?: Record<string, any>): Promise<number>;
    exists(where: Record<string, any>): Promise<boolean>;
    private getMetadata;
    private createEntityFromNode;
}
//# sourceMappingURL=repository.d.ts.map