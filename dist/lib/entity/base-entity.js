"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
const metadata_1 = require("../decorators/metadata");
class BaseEntity {
    constructor(connectionManager) {
        this._isLoaded = false;
        this._connectionManager = connectionManager;
    }
    setId(id) {
        this._id = id;
    }
    getId() {
        return this._id;
    }
    setConnectionManager(connectionManager) {
        this._connectionManager = connectionManager;
    }
    getConnectionManager() {
        if (!this._connectionManager) {
            throw new Error('Connection manager not set. Entity must be created through repository or have connection manager injected.');
        }
        return this._connectionManager;
    }
    markAsLoaded() {
        this._isLoaded = true;
    }
    isLoaded() {
        return this._isLoaded;
    }
    async save() {
        const connectionManager = this.getConnectionManager();
        const session = connectionManager.getSession();
        try {
            const metadata = this.getMetadata();
            const properties = this.getProperties();
            // Validate required properties
            this.validateProperties(metadata, properties);
            const propsString = Object.keys(properties).length > 0
                ? `{${Object.keys(properties).map(key => `${key}: $${key}`).join(', ')}}`
                : '';
            let query;
            let parameters = { ...properties };
            if (this._id) {
                // Update existing node
                query = `MATCH (n:${metadata.label}) WHERE ID(n) = $id SET n += $props RETURN n`;
                parameters.id = this._id;
                parameters.props = properties;
            }
            else {
                // Create new node
                query = `CREATE (n:${metadata.label} ${propsString}) RETURN n`;
            }
            const result = await session.run(query, parameters);
            if (result.records.length > 0) {
                const record = result.records[0];
                const node = record.get('n');
                this._id = node.identity.toNumber();
                // Update properties from database (in case of transformations)
                this.setPropertiesFromDatabase(node.properties);
                this.markAsLoaded();
            }
            return this;
        }
        finally {
            await session.close();
        }
    }
    async delete() {
        if (!this._id) {
            throw new Error('Cannot delete entity without ID');
        }
        const connectionManager = this.getConnectionManager();
        const session = connectionManager.getSession();
        try {
            const metadata = this.getMetadata();
            const query = `MATCH (n:${metadata.label}) WHERE ID(n) = $id DELETE n RETURN count(n) as deleted`;
            const result = await session.run(query, { id: this._id });
            const deleted = result.records[0]?.get('deleted')?.toNumber() > 0;
            if (deleted) {
                this._id = undefined;
                this._isLoaded = false;
            }
            return deleted;
        }
        finally {
            await session.close();
        }
    }
    async reload() {
        if (!this._id) {
            throw new Error('Cannot reload entity without ID');
        }
        const connectionManager = this.getConnectionManager();
        const session = connectionManager.getSession();
        try {
            const metadata = this.getMetadata();
            const query = `MATCH (n:${metadata.label}) WHERE ID(n) = $id RETURN n`;
            const result = await session.run(query, { id: this._id });
            if (result.records.length === 0) {
                throw new Error(`Entity with ID ${this._id} not found`);
            }
            const record = result.records[0];
            const node = record.get('n');
            this.setPropertiesFromDatabase(node.properties);
            this.markAsLoaded();
            return this;
        }
        finally {
            await session.close();
        }
    }
    getMetadata() {
        const metadata = metadata_1.MetadataStorage.getInstance().getNodeMetadata(this.constructor);
        if (!metadata) {
            throw new Error(`No metadata found for ${this.constructor.name}. Did you forget to add @Node decorator?`);
        }
        return metadata;
    }
    getProperties() {
        const metadata = this.getMetadata();
        const properties = {};
        for (const [key, propertyMetadata] of Array.from(metadata.properties)) {
            const value = this[key];
            if (value !== undefined) {
                // Apply transformer if defined
                const transformedValue = propertyMetadata.transformer?.to
                    ? propertyMetadata.transformer.to(value)
                    : value;
                properties[key] = transformedValue;
            }
        }
        return properties;
    }
    setPropertiesFromDatabase(dbProperties) {
        const metadata = this.getMetadata();
        for (const [key, propertyMetadata] of Array.from(metadata.properties)) {
            const value = dbProperties[key];
            if (value !== undefined) {
                // Apply reverse transformer if defined
                const transformedValue = propertyMetadata.transformer?.from
                    ? propertyMetadata.transformer.from(value)
                    : value;
                this[key] = transformedValue;
            }
        }
    }
    validateProperties(metadata, properties) {
        for (const [key, propertyMetadata] of Array.from(metadata.properties)) {
            const value = properties[key];
            // Check required properties
            if (propertyMetadata.required && (value === undefined || value === null)) {
                throw new Error(`Property '${key}' is required but not provided`);
            }
            // Run custom validator if provided
            if (value !== undefined && propertyMetadata.validator && !propertyMetadata.validator(value)) {
                throw new Error(`Property '${key}' failed validation`);
            }
        }
    }
    toJSON() {
        const metadata = this.getMetadata();
        const result = {
            id: this._id,
            label: metadata.label
        };
        // Add all properties
        for (const [key] of Array.from(metadata.properties)) {
            result[key] = this[key];
        }
        return result;
    }
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=base-entity.js.map