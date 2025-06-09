import { QueryResult, IQueryBuilder } from './types';
import { ConnectionManager } from './connection';

export class QueryBuilder implements IQueryBuilder {
  private matchClauses: string[] = [];
  private whereClauses: string[] = [];
  private returnClause: string = '';
  private limitClause: string = '';
  private skipClause: string = '';
  private orderByClause: string = '';
  private parameters: Record<string, any> = {};
  private connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
  }

  match(pattern: string): QueryBuilder {
    this.matchClauses.push(pattern);
    return this;
  }

  where(conditions: Record<string, any>): QueryBuilder {
    Object.entries(conditions).forEach(([key, value]) => {
      const paramName = `param_${Object.keys(this.parameters).length}`;
      this.parameters[paramName] = value;
      this.whereClauses.push(`${key} = $${paramName}`);
    });
    return this;
  }

  return(fields: string): QueryBuilder {
    this.returnClause = fields;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  skip(count: number): QueryBuilder {
    this.skipClause = `SKIP ${count}`;
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByClause = `ORDER BY ${field} ${direction}`;
    return this;
  }

  build(): string {
    const parts: string[] = [];

    if (this.matchClauses.length > 0) {
      parts.push(`MATCH ${this.matchClauses.join(', ')}`);
    }

    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' AND ')}`);
    }

    if (this.returnClause) {
      parts.push(`RETURN ${this.returnClause}`);
    }

    if (this.orderByClause) {
      parts.push(this.orderByClause);
    }

    if (this.skipClause) {
      parts.push(this.skipClause);
    }

    if (this.limitClause) {
      parts.push(this.limitClause);
    }

    return parts.join(' ');
  }

  async execute(): Promise<QueryResult> {
    const query = this.build();
    const session = this.connectionManager.getSession();

    try {
      const result = await session.run(query, this.parameters);
      
      return {
        records: result.records.map(record => {
          const obj: any = {};
          record.keys.forEach(key => {
            const value = record.get(key);
            if (value && typeof value === 'object' && value.properties) {
              obj[key] = { ...value.properties, id: value.identity?.toNumber() };
            } else {
              obj[key] = value;
            }
          });
          return obj;
        }),
        summary: result.summary
      };
    } finally {
      await session.close();
    }
  }

  static create(connectionManager: ConnectionManager): QueryBuilder {
    return new QueryBuilder(connectionManager);
  }
}

export class RawQuery {
  private connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
  }

  async execute(query: string, parameters: Record<string, any> = {}): Promise<QueryResult> {
    const session = this.connectionManager.getSession();

    try {
      const result = await session.run(query, parameters);
      
      return {
        records: result.records.map(record => {
          const obj: any = {};
          record.keys.forEach(key => {
            const value = record.get(key);
            if (value && typeof value === 'object' && value.properties) {
              obj[key] = { ...value.properties, id: value.identity?.toNumber() };
            } else {
              obj[key] = value;
            }
          });
          return obj;
        }),
        summary: result.summary
      };
    } finally {
      await session.close();
    }
  }

  async executeInTransaction<T>(
    queries: Array<{ query: string; parameters?: Record<string, any> }>,
    callback?: (results: QueryResult[]) => T
  ): Promise<T | QueryResult[]> {
    const session = this.connectionManager.getSession();

    try {
      const results = await session.executeWrite(async tx => {
        const queryResults: QueryResult[] = [];
        
        for (const { query, parameters = {} } of queries) {
          const result = await tx.run(query, parameters);
          queryResults.push({
            records: result.records.map(record => {
              const obj: any = {};
              record.keys.forEach(key => {
                const value = record.get(key);
                if (value && typeof value === 'object' && value.properties) {
                  obj[key] = { ...value.properties, id: value.identity?.toNumber() };
                } else {
                  obj[key] = value;
                }
              });
              return obj;
            }),
            summary: result.summary
          });
        }
        
        return queryResults;
      });

      return callback ? callback(results) : results;
    } finally {
      await session.close();
    }
  }
}