import 'reflect-metadata';
import { RelationshipOptions, RelationshipMetadata } from './types';
import { MetadataStorage } from './metadata';

export function Relationship(
  type: string,
  target: () => any,
  options?: RelationshipOptions
): PropertyDecorator {
  return function (targetObject: any, propertyKey: string | symbol): void {
    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol property keys are not supported');
    }

    const metadata = MetadataStorage.getInstance();
    const designType = Reflect.getMetadata('design:type', targetObject, propertyKey);
    
    // Check if it's an array type to determine if multiple relationships are allowed
    const isArray = designType === Array;
    
    const relationshipMetadata: RelationshipMetadata = {
      key: propertyKey,
      type,
      target,
      direction: options?.direction || 'out',
      multiple: isArray,
      required: options?.required || false
    };

    metadata.addRelationshipMetadata(targetObject.constructor, relationshipMetadata);
  };
}