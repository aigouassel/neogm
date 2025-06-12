"use strict";
/**
 * Connection configuration types and interfaces for Neo4j connections
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeConfig = normalizeConfig;
/**
 * Resolves a connection config to a normalized format
 * @param config The connection configuration to normalize
 * @returns Normalized configuration
 */
function normalizeConfig(config) {
    // If config is a string, convert to SingleDatabaseConfig
    if (typeof config === 'string') {
        return {
            default: 'default',
            databases: {
                default: {
                    name: 'default',
                    uri: config,
                    auth: {
                        username: 'neo4j',
                        password: 'neo4j'
                    }
                }
            }
        };
    }
    // If config is a SingleDatabaseConfig, convert to MultiDatabaseConfig
    if ('uri' in config) {
        return {
            default: 'default',
            databases: {
                default: {
                    name: 'default',
                    ...config
                }
            }
        };
    }
    // Config is already a MultiDatabaseConfig
    return config;
}
//# sourceMappingURL=connection-config.js.map