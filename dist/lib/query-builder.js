"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawQuery = exports.QueryBuilder = void 0;
class QueryBuilder {
    constructor(connectionManager) {
        this.matchClauses = [];
        this.whereClauses = [];
        this.returnClause = '';
        this.limitClause = '';
        this.skipClause = '';
        this.orderByClause = '';
        this.parameters = {};
        this.connectionManager = connectionManager;
    }
    match(pattern) {
        this.matchClauses.push(`MATCH ${pattern}`);
        return this;
    }
    optionalMatch(pattern) {
        this.matchClauses.push(`OPTIONAL MATCH ${pattern}`);
        return this;
    }
    where(conditions) {
        if (typeof conditions === 'string') {
            this.whereClauses.push(conditions);
        }
        else {
            Object.entries(conditions).forEach(([key, value]) => {
                const paramName = `param_${Object.keys(this.parameters).length}`;
                this.parameters[paramName] = value;
                this.whereClauses.push(`${key} = $${paramName}`);
            });
        }
        return this;
    }
    return(fields) {
        this.returnClause = fields;
        return this;
    }
    limit(count) {
        this.limitClause = `LIMIT ${count}`;
        return this;
    }
    skip(count) {
        this.skipClause = `SKIP ${count}`;
        return this;
    }
    orderBy(field, direction = 'ASC') {
        this.orderByClause = `ORDER BY ${field} ${direction}`;
        return this;
    }
    build() {
        const parts = [];
        if (this.matchClauses.length > 0) {
            parts.push(this.matchClauses.join(' '));
        }
        if (this.whereClauses.length > 0) {
            parts.push(`WHERE ${this.whereClauses.join(' AND ')}`);
        }
        if (this.returnClause) {
            parts.push(`RETURN ${this.returnClause}`);
        }
        if (this.orderByClause) {
            parts.push(this.orderByClause);
        }
        if (this.skipClause) {
            parts.push(this.skipClause);
        }
        if (this.limitClause) {
            parts.push(this.limitClause);
        }
        return parts.join(' ');
    }
    async execute() {
        const query = this.build();
        const session = this.connectionManager.getSession();
        try {
            const result = await session.run(query, this.parameters);
            return {
                records: result.records.map(record => {
                    const obj = {};
                    record.keys.forEach(key => {
                        const value = record.get(key);
                        if (value && typeof value === 'object' && value.properties) {
                            obj[key] = { ...value.properties, id: value.identity?.toNumber() };
                        }
                        else if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
                            // Handle Neo4j integers
                            obj[key] = value.toNumber();
                        }
                        else {
                            obj[key] = value;
                        }
                    });
                    return obj;
                }),
                summary: result.summary
            };
        }
        finally {
            await session.close();
        }
    }
    static create(connectionManager) {
        return new QueryBuilder(connectionManager);
    }
}
exports.QueryBuilder = QueryBuilder;
class RawQuery {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
    }
    async execute(query, parameters = {}) {
        const session = this.connectionManager.getSession();
        try {
            const result = await session.run(query, parameters);
            return {
                records: result.records.map(record => {
                    const obj = {};
                    record.keys.forEach(key => {
                        const value = record.get(key);
                        if (value && typeof value === 'object' && value.properties) {
                            obj[key] = { ...value.properties, id: value.identity?.toNumber() };
                        }
                        else if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
                            // Handle Neo4j integers
                            obj[key] = value.toNumber();
                        }
                        else {
                            obj[key] = value;
                        }
                    });
                    return obj;
                }),
                summary: result.summary
            };
        }
        finally {
            await session.close();
        }
    }
    async executeInTransaction(queries, callback) {
        const session = this.connectionManager.getSession();
        try {
            const results = await session.executeWrite(async (tx) => {
                const queryResults = [];
                for (const { query, parameters = {} } of queries) {
                    const result = await tx.run(query, parameters);
                    queryResults.push({
                        records: result.records.map(record => {
                            const obj = {};
                            record.keys.forEach(key => {
                                const value = record.get(key);
                                if (value && typeof value === 'object' && value.properties) {
                                    obj[key] = { ...value.properties, id: value.identity?.toNumber() };
                                }
                                else {
                                    obj[key] = value;
                                }
                            });
                            return obj;
                        }),
                        summary: result.summary
                    });
                }
                return queryResults;
            });
            return callback ? callback(results) : results;
        }
        finally {
            await session.close();
        }
    }
}
exports.RawQuery = RawQuery;
//# sourceMappingURL=query-builder.js.map