import { QueryResult, IQueryBuilder } from './types';
import { ConnectionManager } from './connection';
export declare class QueryBuilder implements IQueryBuilder {
    private matchClauses;
    private whereClauses;
    private returnClause;
    private limitClause;
    private skipClause;
    private orderByClause;
    private parameters;
    private connectionManager;
    constructor(connectionManager: ConnectionManager);
    match(pattern: string): QueryBuilder;
    optionalMatch(pattern: string): QueryBuilder;
    where(conditions: Record<string, any> | string): QueryBuilder;
    return(fields: string): QueryBuilder;
    limit(count: number): QueryBuilder;
    skip(count: number): QueryBuilder;
    orderBy(field: string, direction?: 'ASC' | 'DESC'): QueryBuilder;
    build(): string;
    execute(): Promise<QueryResult>;
    static create(connectionManager: ConnectionManager): QueryBuilder;
}
export declare class RawQuery {
    private connectionManager;
    constructor(connectionManager: ConnectionManager);
    execute<T = any>(query: string, parameters?: Record<string, any>): Promise<QueryResult<T>>;
    executeInTransaction<T>(queries: Array<{
        query: string;
        parameters?: Record<string, any>;
    }>, callback?: (results: QueryResult[]) => T): Promise<T | QueryResult[]>;
}
//# sourceMappingURL=query-builder.d.ts.map