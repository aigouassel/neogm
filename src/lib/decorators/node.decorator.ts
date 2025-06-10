import 'reflect-metadata';
import { NodeOptions, NodeMetadata } from './types';
import { MetadataStorage } from './metadata';

export function Node(label?: string): ClassDecorator;
export function Node(options?: NodeOptions): ClassDecorator;
export function Node(labelOrOptions?: string | NodeOptions): ClassDecorator {
  return function <T extends Function>(target: T): T {
    const metadata = MetadataStorage.getInstance();
    
    let label: string;
    let options: NodeOptions = {};

    if (typeof labelOrOptions === 'string') {
      label = labelOrOptions;
    } else if (labelOrOptions) {
      label = labelOrOptions.label || target.name;
      options = labelOrOptions;
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