"use strict";
/**
 * Data Access Layer for Neo4j - exports the core components
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neo4j = void 0;
exports.initNeo4j = initNeo4j;
exports.getConnectionManager = getConnectionManager;
exports.getSessionManager = getSessionManager;
exports.getQueryRunner = getQueryRunner;
exports.runQuery = runQuery;
exports.closeNeo4j = closeNeo4j;
__exportStar(require("./connection-config"), exports);
__exportStar(require("./connection-manager"), exports);
__exportStar(require("./session-manager"), exports);
__exportStar(require("./query-runner"), exports);
// Re-export Neo4j driver types
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
exports.Neo4j = neo4j_driver_1.default;
// Convenience access to manager instances
const connection_manager_1 = require("./connection-manager");
const session_manager_1 = require("./session-manager");
const query_runner_1 = require("./query-runner");
/**
 * Initialize the Neo4j connection
 * @param config Neo4j connection configuration
 */
function initNeo4j(config) {
    connection_manager_1.ConnectionManager.getInstance().init(config);
}
/**
 * Get the connection manager instance
 */
function getConnectionManager() {
    return connection_manager_1.ConnectionManager.getInstance();
}
/**
 * Get the session manager instance
 */
function getSessionManager() {
    return session_manager_1.SessionManager.getInstance();
}
/**
 * Get the query runner instance
 */
function getQueryRunner() {
    return query_runner_1.QueryRunner.getInstance();
}
/**
 * Run a direct query against Neo4j
 * @param query Cypher query string
 * @param params Query parameters
 * @returns Query result
 */
function runQuery(query, params = {}) {
    return query_runner_1.QueryRunner.getInstance().run(query, params);
}
/**
 * Clean up all Neo4j connections and sessions
 */
async function closeNeo4j() {
    // Close all active sessions first
    await session_manager_1.SessionManager.getInstance().closeAll();
    // Then close all drivers
    await connection_manager_1.ConnectionManager.getInstance().closeAll();
}
//# sourceMappingURL=index.js.map