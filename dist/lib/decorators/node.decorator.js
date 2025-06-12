"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = Node;
require("reflect-metadata");
const metadata_1 = require("./metadata");
function Node(labelOrOptions) {
    return function (target) {
        const metadata = metadata_1.MetadataStorage.getInstance();
        let label;
        if (typeof labelOrOptions === 'string') {
            label = labelOrOptions;
        }
        else if (labelOrOptions) {
            label = labelOrOptions.label || target.name;
        }
        else {
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
//# sourceMappingURL=node.decorator.js.map