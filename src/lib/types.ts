import { ManagedTransaction } from 'neo4j-driver';

export interface NeoGMConfig {
  uri: string;
  user: string;
  password: string;
  database?: string;
}

export interface NodeProperties {
  [key: string]: any;
}

export interface RelationshipProperties {
  [key: string]: any;
}

export interface QueryResult<T = any> {
  records: T[];
  summary: any;
}

export interface NodeDefinition {
  label: string;
  properties: NodeProperties;
  id?: string | number;
}

export interface RelationshipDefinition {
  type: string;
  properties: RelationshipProperties;
  startNode: NodeDefinition;
  endNode: NodeDefinition;
  id?: string | number;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  orderBy?: string;
  where?: Record<string, any>;
}

export interface IQueryBuilder {
  match(pattern: string): IQueryBuilder;
  optionalMatch(pattern: string): IQueryBuilder;
  where(conditions: Record<string, any> | string): IQueryBuilder;
  return(fields: string): IQueryBuilder;
  limit(count: number): IQueryBuilder;
  skip(count: number): IQueryBuilder;
  orderBy(field: string, direction?: 'ASC' | 'DESC'): IQueryBuilder;
  build(): string;
  execute(): Promise<QueryResult>;
}

export type TransactionFunction<T> = (tx: ManagedTransaction) => Promise<T>;