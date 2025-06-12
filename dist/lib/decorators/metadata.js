"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataStorage = void 0;
require("reflect-metadata");
class MetadataStorage {
    constructor() {
        this.nodeMetadata = new Map();
    }
    static getInstance() {
        if (!MetadataStorage.instance) {
            MetadataStorage.instance = new MetadataStorage();
        }
        return MetadataStorage.instance;
    }
    setNodeMetadata(target, metadata) {
        this.nodeMetadata.set(target, metadata);
    }
    getNodeMetadata(target) {
        return this.nodeMetadata.get(target);
    }
    addPropertyMetadata(target, property) {
        let metadata = this.getNodeMetadata(target);
        if (!metadata) {
            metadata = {
                label: target.name,
                properties: new Map(),
                relationships: new Map()
            };
            this.setNodeMetadata(target, metadata);
        }
        metadata.properties.set(property.key, property);
    }
    addRelationshipMetadata(target, relationship) {
        let metadata = this.getNodeMetadata(target);
        if (!metadata) {
            metadata = {
                label: target.name,
                properties: new Map(),
                relationships: new Map()
            };
            this.setNodeMetadata(target, metadata);
        }
        metadata.relationships.set(relationship.key, relationship);
    }
    getPropertyMetadata(target, propertyKey) {
        const metadata = this.getNodeMetadata(target);
        return metadata?.properties.get(propertyKey);
    }
    getRelationshipMetadata(target, propertyKey) {
        const metadata = this.getNodeMetadata(target);
        return metadata?.relationships.get(propertyKey);
    }
    getAllPropertyNames(target) {
        const metadata = this.getNodeMetadata(target);
        return metadata ? Array.from(metadata.properties.keys()) : [];
    }
    getAllRelationshipNames(target) {
        const metadata = this.getNodeMetadata(target);
        return metadata ? Array.from(metadata.relationships.keys()) : [];
    }
}
exports.MetadataStorage = MetadataStorage;
//# sourceMappingURL=metadata.js.map