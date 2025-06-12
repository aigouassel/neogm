"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const metadata_1 = require("../decorators/metadata");
class Repository {
    constructor(entityClass, connectionManager) {
        this.entityClass = entityClass;
        this.connectionManager = connectionManager;
    }
    async findById(id) {
        const session = this.connectionManager.getSession();
        try {
            const metadata = this.getMetadata();
            const query = `MATCH (n:${metadata.label}) WHERE ID(n) = $id RETURN n`;
            const result = await session.run(query, { id });
            if (result.records.length === 0) {
                return null;
            }
            const record = result.records[0];
            const nodeData = record.get('n');
            return this.createEntityFromNode(nodeData);
        }
        finally {
            await session.close();
        }
    }
    async findOne(where) {
        const results = await this.find({ where, limit: 1 });
        return results.length > 0 ? results[0] : null;
    }
    async find(options) {
        const session = this.connectionManager.getSession();
        try {
            const metadata = this.getMetadata();
            let query = `MATCH (n:${metadata.label})`;
            const parameters = {};
            if (options?.where) {
                const whereConditions = Object.keys(options.where).map(key => {
                    parameters[key] = options.where[key];
                    return `n.${key} = $${key}`;
                });
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }
            query += ` RETURN n`;
            if (options?.orderBy) {
                query += ` ORDER BY n.${options.orderBy}`;
            }
            if (options?.skip) {
                query += ` SKIP ${options.skip}`;
            }
            if (options?.limit) {
                query += ` LIMIT ${options.limit}`;
            }
            const result = await session.run(query, parameters);
            return result.records.map(record => {
                const nodeData = record.get('n');
                return this.createEntityFromNode(nodeData);
            });
        }
        finally {
            await session.close();
        }
    }
    async create(data) {
        const entity = new this.entityClass();
        entity.setConnectionManager(this.connectionManager);
        // Set properties from data
        Object.assign(entity, data);
        return entity;
    }
    async save(entity) {
        if (!entity.getConnectionManager()) {
            entity.setConnectionManager(this.connectionManager);
        }
        return await entity.save();
    }
    async delete(entity) {
        return await entity.delete();
    }
    async count(where) {
        const session = this.connectionManager.getSession();
        try {
            const metadata = this.getMetadata();
            let query = `MATCH (n:${metadata.label})`;
            const parameters = {};
            if (where) {
                const whereConditions = Object.keys(where).map(key => {
                    parameters[key] = where[key];
                    return `n.${key} = $${key}`;
                });
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }
            query += ` RETURN count(n) as total`;
            const result = await session.run(query, parameters);
            return result.records[0]?.get('total').toNumber() || 0;
        }
        finally {
            await session.close();
        }
    }
    async exists(where) {
        const count = await this.count(where);
        return count > 0;
    }
    getMetadata() {
        const metadata = metadata_1.MetadataStorage.getInstance().getNodeMetadata(this.entityClass);
        if (!metadata) {
            throw new Error(`No metadata found for ${this.entityClass.name}. Did you forget to add @Node decorator?`);
        }
        return metadata;
    }
    createEntityFromNode(nodeData) {
        const entity = new this.entityClass();
        entity.setConnectionManager(this.connectionManager);
        entity.setId(nodeData.identity.toNumber());
        // Set properties from database
        const metadata = this.getMetadata();
        for (const [key, propertyMetadata] of Array.from(metadata.properties)) {
            const value = nodeData.properties[key];
            if (value !== undefined) {
                // Apply reverse transformer if defined
                const transformedValue = propertyMetadata.transformer?.from
                    ? propertyMetadata.transformer.from(value)
                    : value;
                entity[key] = transformedValue;
            }
        }
        entity.markAsLoaded();
        return entity;
    }
}
exports.Repository = Repository;
//# sourceMappingURL=repository.js.map