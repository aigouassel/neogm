import 'reflect-metadata';
import { PropertyOptions, PropertyMetadata } from './types';
import { MetadataStorage } from './metadata';

export function Property(options?: PropertyOptions): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    if (typeof propertyKey === 'symbol') {
      throw new Error('Symbol property keys are not supported');
    }

    const metadata = MetadataStorage.getInstance();
    const type = Reflect.getMetadata('design:type', target, propertyKey);

    const propertyMetadata: PropertyMetadata = {
      key: propertyKey,
      type,
      required: options?.required || false,
      unique: options?.unique || false,
      indexed: options?.indexed || false,
      validator: options?.validator,
      transformer: options?.transformer
    };

    metadata.addPropertyMetadata(target.constructor, propertyMetadata);
  };
}