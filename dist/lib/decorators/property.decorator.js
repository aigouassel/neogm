"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Property = Property;
require("reflect-metadata");
const metadata_1 = require("./metadata");
function Property(options) {
    return function (target, propertyKey) {
        if (typeof propertyKey === 'symbol') {
            throw new Error('Symbol property keys are not supported');
        }
        const metadata = metadata_1.MetadataStorage.getInstance();
        const type = Reflect.getMetadata('design:type', target, propertyKey);
        const propertyMetadata = {
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
//# sourceMappingURL=property.decorator.js.map