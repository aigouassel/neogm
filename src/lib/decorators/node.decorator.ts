import 'reflect-metadata';
import { NodeOptions } from './types';
import { MetadataStorage } from './metadata';

export function Node(labelOrOptions?: string | NodeOptions): ClassDecorator {
  return function <T extends Function>(target: T): T {
    const metadata = MetadataStorage.getInstance();
    
    let label: string;

    if (typeof labelOrOptions === 'string') {
      label = labelOrOptions;
    } else if (labelOrOptions) {
      label = labelOrOptions.label || target.name;
    } else {
      label = target.name;
    }

    const existingMetadata = metadata.getNodeMetadata(target) || {
      label,
      properties: new Map(),
      relationships: new Map()
    };

    existingMetadata.label = label;
    metadata.setNodeMetadata(target, existingMetadata);

    return target;
  };
}