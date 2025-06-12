import { Driver, Session } from 'neo4j-driver';
import { NeoGMConfig } from './types';
export declare class ConnectionManager {
    private driver;
    private config;
    constructor(config: NeoGMConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getSession(): Session;
    getDriver(): Driver;
    isConnected(): boolean;
}
//# sourceMappingURL=connection.d.ts.map