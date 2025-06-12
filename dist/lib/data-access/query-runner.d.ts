/**
 * Query runner for executing Neo4j queries
 */
import { Record as Neo4jRecord } from 'neo4j-driver';
import { SessionOptions } from './session-manager';
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
export declare class QueryRunner {
    private static instance;
    private sessionManager;
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor();
    /**
     * Get the singleton instance of the query runner
     */
    static getInstance(): QueryRunner;
    /**
     * Run a query and map the results
     * @param query Cypher query string
     * @param params Query parameters
     * @param mapper Function to map Neo4j records to domain objects
     * @param options Query options
     * @returns Array of mapped objects
     */
    run<T>(query: string, params?: Record<string, any>, mapper?: RecordMapper<T>, options?: QueryOptions): Promise<T[]>;
    /**
     * Run a query that returns a single result
     * @param query Cypher query string
     * @param params Query parameters
     * @param mapper Function to map Neo4j records to domain objects
     * @param options Query options
     * @returns Single mapped object or null if no results
     */
    runOne<T>(query: string, params?: Record<string, any>, mapper?: RecordMapper<T>, options?: QueryOptions): Promise<T | null>;
    /**
     * Run a query and extract values from a specific field
     * @param query Cypher query string
     * @param field Field name to extract
     * @param params Query parameters
     * @param options Query options
     * @returns Array of field values
     */
    runAndGetField<T>(query: string, field: string, params?: Record<string, any>, options?: QueryOptions): Promise<T[]>;
    /**
     * Run a query that returns a count
     * @param query Cypher query that returns a count
     * @param params Query parameters
     * @param countField Field name that contains the count (default: 'count')
     * @param options Query options
     * @returns Count value
     */
    count(query: string, params?: Record<string, any>, countField?: string, options?: QueryOptions): Promise<number>;
    /**
     * Check if a query returns any results
     * @param query Cypher query
     * @param params Query parameters
     * @param options Query options
     * @returns True if the query returns at least one record
     */
    exists(query: string, params?: Record<string, any>, options?: QueryOptions): Promise<boolean>;
}
//# sourceMappingURL=query-runner.d.ts.map