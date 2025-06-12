export interface NodeMetadata {
    label: string;
    properties: Map<string, PropertyMetadata>;
    relationships: Map<string, RelationshipMetadata>;
}
export interface PropertyMetadata {
    key: string;
    type: any;
    required?: boolean;
    unique?: boolean;
    indexed?: boolean;
    validator?: (value: any) => boolean;
    transformer?: {
        to: (value: any) => any;
        from: (value: any) => any;
    };
}
export interface RelationshipMetadata {
    key: string;
    type: string;
    target: () => any;
    direction: 'in' | 'out' | 'both';
    multiple: boolean;
    required?: boolean;
    properties?: Map<string, PropertyMetadata>;
}
export interface NodeOptions {
    label?: string;
}
export interface PropertyOptions {
    type?: string;
    required?: boolean;
    unique?: boolean;
    indexed?: boolean;
    validator?: (value: any) => boolean;
    transformer?: {
        to: (value: any) => any;
        from: (value: any) => any;
    };
}
export interface RelationshipOptions {
    direction?: 'in' | 'out' | 'both';
    required?: boolean;
}
export declare const METADATA_KEY: unique symbol;
//# sourceMappingURL=types.d.ts.map