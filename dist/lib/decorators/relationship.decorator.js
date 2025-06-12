"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relationship = Relationship;
require("reflect-metadata");
const metadata_1 = require("./metadata");
function Relationship(type, target, options) {
    return function (targetObject, propertyKey) {
        if (typeof propertyKey === 'symbol') {
            throw new Error('Symbol property keys are not supported');
        }
        const metadata = metadata_1.MetadataStorage.getInstance();
        const designType = Reflect.getMetadata('design:type', targetObject, propertyKey);
        // Check if it's an array type to determine if multiple relationships are allowed
        const isArray = designType === Array;
        const relationshipMetadata = {
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
//# sourceMappingURL=relationship.decorator.js.map