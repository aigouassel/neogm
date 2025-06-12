/**
 * Query runner for executing Neo4j queries
 */

import { Record as Neo4jRecord } from 'neo4j-driver';
import { SessionManager, SessionOptions } from './session-manager';

/**
 * Options for query execution
 */
export interface QueryOptions extends SessionOptions {
  /** Whether to return raw Neo4j records instead of processed results */
  rawResults?: boolean;
}

/**
 * Type for data mapping function
 */
export type RecordMapper<T> = (record: Neo4jRecord) => T;

/**
 * Executes queries against Neo4j database
 */
export class QueryRunner {
  private static instance: QueryRunner;
  private sessionManager: SessionManager;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  /**
   * Get the singleton instance of the query runner
   */
  public static getInstance(): QueryRunner {
    if (!QueryRunner.instance) {
      QueryRunner.instance = new QueryRunner();
    }
    return QueryRunner.instance;
  }

  /**
   * Run a query and map the results
   * @param query Cypher query string
   * @param params Query parameters
   * @param mapper Function to map Neo4j records to domain objects
   * @param options Query options
   * @returns Array of mapped objects
   */
  public async run<T>(
    query: string, 
    params: Record<string, any> = {}, 
    mapper?: RecordMapper<T>,
    options: QueryOptions = {}
  ): Promise<T[]> {
    // Execute the query
    const result = await this.sessionManager.run(query, params, options);
    
    // Return raw results if requested
    if (options.rawResults) {
      return result.records as any as T[];
    }
    
    // Map the results if a mapper is provided
    if (mapper) {
      return result.records.map(record => mapper(record));
    }
    
    // Default processing: Extract values from records
    return result.records.map(record => {
      // If record has only one field, return that value
      if (record.keys.length === 1) {
        return record.get(record.keys[0]) as any as T;
      }
      
      // Otherwise, create an object with all fields
      const obj: any = {};
      record.keys.forEach(key => {
        obj[key] = record.get(key);
      });
      return obj as T;
    });
  }

  /**
   * Run a query that returns a single result
   * @param query Cypher query string
   * @param params Query parameters
   * @param mapper Function to map Neo4j records to domain objects
   * @param options Query options
   * @returns Single mapped object or null if no results
   */
  public async runOne<T>(
    query: string, 
    params: Record<string, any> = {}, 
    mapper?: RecordMapper<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    const results = await this.run<T>(query, params, mapper, options);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Run a query and extract values from a specific field
   * @param query Cypher query string
   * @param field Field name to extract
   * @param params Query parameters
   * @param options Query options
   * @returns Array of field values
   */
  public async runAndGetField<T>(
    query: string,
    field: string,
    params: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<T[]> {
    const result = await this.sessionManager.run(query, params, options);
    return result.records.map(record => record.get(field) as T);
  }

  /**
   * Run a query that returns a count
   * @param query Cypher query that returns a count
   * @param params Query parameters
   * @param countField Field name that contains the count (default: 'count')
   * @param options Query options
   * @returns Count value
   */
  public async count(
    query: string,
    params: Record<string, any> = {},
    countField: string = 'count',
    options: QueryOptions = {}
  ): Promise<number> {
    const result = await this.runOne<any>(query, params, undefined, options);
    return result ? (typeof result === 'object' ? result[countField] : result) : 0;
  }
  
  /**
   * Check if a query returns any results
   * @param query Cypher query
   * @param params Query parameters
   * @param options Query options
   * @returns True if the query returns at least one record
   */
  public async exists(
    query: string,
    params: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<boolean> {
    const result = await this.sessionManager.run(query, params, options);
    return result.records.length > 0;
  }
}