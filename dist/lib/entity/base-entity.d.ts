import { ConnectionManager } from '../connection';
export declare abstract class BaseEntity {
    private _id?;
    private _connectionManager?;
    private _isLoaded;
    constructor(connectionManager?: ConnectionManager);
    setId(id: string | number): void;
    getId(): string | number | undefined;
    setConnectionManager(connectionManager: ConnectionManager): void;
    getConnectionManager(): ConnectionManager;
    markAsLoaded(): void;
    isLoaded(): boolean;
    save(): Promise<this>;
    delete(): Promise<boolean>;
    reload(): Promise<this>;
    private getMetadata;
    private getProperties;
    private setPropertiesFromDatabase;
    private validateProperties;
    toJSON(): Record<string, any>;
}
//# sourceMappingURL=base-entity.d.ts.map