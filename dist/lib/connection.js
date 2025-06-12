"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const neo4j_driver_1 = __importStar(require("neo4j-driver"));
class ConnectionManager {
    constructor(config) {
        this.driver = null;
        this.config = config;
    }
    async connect() {
        if (this.driver) {
            return;
        }
        this.driver = neo4j_driver_1.default.driver(this.config.uri, neo4j_driver_1.auth.basic(this.config.user, this.config.password));
        try {
            await this.driver.verifyConnectivity();
        }
        catch (error) {
            await this.driver.close();
            this.driver = null;
            throw new Error(`Failed to connect to Neo4j: ${error}`);
        }
    }
    async disconnect() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
        }
    }
    getSession() {
        if (!this.driver) {
            throw new Error('Connection not established. Call connect() first.');
        }
        const sessionConfig = this.config.database
            ? { database: this.config.database }
            : {};
        return this.driver.session(sessionConfig);
    }
    getDriver() {
        if (!this.driver) {
            throw new Error('Connection not established. Call connect() first.');
        }
        return this.driver;
    }
    isConnected() {
        return this.driver !== null;
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=connection.js.map