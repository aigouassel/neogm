import 'reflect-metadata';
import { NodeMetadata, PropertyMetadata, RelationshipMetadata } from './types';
export declare class MetadataStorage {
    private static instance;
    private nodeMetadata;
    static getInstance(): MetadataStorage;
    setNodeMetadata(target: Function, metadata: NodeMetadata): void;
    getNodeMetadata(target: Function): NodeMetadata | undefined;
    addPropertyMetadata(target: Function, property: PropertyMetadata): void;
    addRelationshipMetadata(target: Function, relationship: RelationshipMetadata): void;
    getPropertyMetadata(target: Function, propertyKey: string): PropertyMetadata | undefined;
    getRelationshipMetadata(target: Function, propertyKey: string): RelationshipMetadata | undefined;
    getAllPropertyNames(target: Function): string[];
    getAllRelationshipNames(target: Function): string[];
}
//# sourceMappingURL=metadata.d.ts.map