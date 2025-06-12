import 'reflect-metadata';
import { NodeMetadata, PropertyMetadata, RelationshipMetadata } from './types';

export class MetadataStorage {
  private static instance: MetadataStorage;
  private nodeMetadata = new Map<Function, NodeMetadata>();

  static getInstance(): MetadataStorage {
    if (!MetadataStorage.instance) {
      MetadataStorage.instance = new MetadataStorage();
    }
    return MetadataStorage.instance;
  }

  setNodeMetadata(target: Function, metadata: NodeMetadata): void {
    this.nodeMetadata.set(target, metadata);
  }

  getNodeMetadata(target: Function): NodeMetadata | undefined {
    return this.nodeMetadata.get(target);
  }

  addPropertyMetadata(target: Function, property: PropertyMetadata): void {
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

  addRelationshipMetadata(target: Function, relationship: RelationshipMetadata): void {
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

  getPropertyMetadata(target: Function, propertyKey: string): PropertyMetadata | undefined {
    const metadata = this.getNodeMetadata(target);
    return metadata?.properties.get(propertyKey);
  }

  getRelationshipMetadata(target: Function, propertyKey: string): RelationshipMetadata | undefined {
    const metadata = this.getNodeMetadata(target);
    return metadata?.relationships.get(propertyKey);
  }

  getAllPropertyNames(target: Function): string[] {
    const metadata = this.getNodeMetadata(target);
    return metadata ? Array.from(metadata.properties.keys()) : [];
  }

  getAllRelationshipNames(target: Function): string[] {
    const metadata = this.getNodeMetadata(target);
    return metadata ? Array.from(metadata.relationships.keys()) : [];
  }
}