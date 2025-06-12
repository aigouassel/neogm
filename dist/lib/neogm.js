"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeoGM = void 0;
const connection_1 = require("./connection");
const query_builder_1 = require("./query-builder");
const entity_1 = require("./entity");
class NeoGM {
    constructor(config) {
        this.repositories = new Map();
        this.connectionManager = new connection_1.ConnectionManager(config);
    }
    async connect() {
        await this.connectionManager.connect();
    }
    async disconnect() {
        await this.connectionManager.disconnect();
    }
    isConnected() {
        return this.connectionManager.isConnected();
    }
    queryBuilder() {
        return query_builder_1.QueryBuilder.create(this.connectionManager);
    }
    rawQuery() {
        return new query_builder_1.RawQuery(this.connectionManager);
    }
    async executeInTransaction(fn) {
        const session = this.connectionManager.getSession();
        try {
            return await session.executeWrite(fn);
        }
        finally {
            await session.close();
        }
    }
    async executeReadTransaction(fn) {
        const session = this.connectionManager.getSession();
        try {
            return await session.executeRead(fn);
        }
        finally {
            await session.close();
        }
    }
    async clearDatabase() {
        const session = this.connectionManager.getSession();
        try {
            await session.run('MATCH (n) DETACH DELETE n');
        }
        finally {
            await session.close();
        }
    }
    getRepository(entityClass) {
        if (!this.repositories.has(entityClass)) {
            const repository = new entity_1.Repository(entityClass, this.connectionManager);
            this.repositories.set(entityClass, repository);
        }
        return this.repositories.get(entityClass);
    }
    createEntity(entityClass, data) {
        const entity = new entityClass();
        entity.setConnectionManager(this.connectionManager);
        if (data) {
            Object.assign(entity, data);
        }
        return entity;
    }
}
exports.NeoGM = NeoGM;
//# sourceMappingURL=neogm.js.map