"use strict";
/**
 * Query runner for executing Neo4j queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryRunner = void 0;
const session_manager_1 = require("./session-manager");
/**
 * Executes queries against Neo4j database
 */
class QueryRunner {
    /**
     * Private constructor to enforce singleton pattern
     */
    constructor() {
        this.sessionManager = session_manager_1.SessionManager.getInstance();
    }
    /**
     * Get the singleton instance of the query runner
     */
    static getInstance() {
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
    async run(query, params = {}, mapper, options = {}) {
        // Execute the query
        const result = await this.sessionManager.run(query, params, options);
        // Return raw results if requested
        if (options.rawResults) {
            return result.records;
        }
        // Map the results if a mapper is provided
        if (mapper) {
            return result.records.map(record => mapper(record));
        }
        // Default processing: Extract values from records
        return result.records.map(record => {
            // If record has only one field, return that value
            if (record.keys.length === 1) {
                return record.get(record.keys[0]);
            }
            // Otherwise, create an object with all fields
            const obj = {};
            record.keys.forEach(key => {
                obj[key] = record.get(key);
            });
            return obj;
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
    async runOne(query, params = {}, mapper, options = {}) {
        const results = await this.run(query, params, mapper, options);
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
    async runAndGetField(query, field, params = {}, options = {}) {
        const result = await this.sessionManager.run(query, params, options);
        return result.records.map(record => record.get(field));
    }
    /**
     * Run a query that returns a count
     * @param query Cypher query that returns a count
     * @param params Query parameters
     * @param countField Field name that contains the count (default: 'count')
     * @param options Query options
     * @returns Count value
     */
    async count(query, params = {}, countField = 'count', options = {}) {
        const result = await this.runOne(query, params, undefined, options);
        return result ? (typeof result === 'object' ? result[countField] : result) : 0;
    }
    /**
     * Check if a query returns any results
     * @param query Cypher query
     * @param params Query parameters
     * @param options Query options
     * @returns True if the query returns at least one record
     */
    async exists(query, params = {}, options = {}) {
        const result = await this.sessionManager.run(query, params, options);
        return result.records.length > 0;
    }
}
exports.QueryRunner = QueryRunner;
//# sourceMappingURL=query-runner.js.map