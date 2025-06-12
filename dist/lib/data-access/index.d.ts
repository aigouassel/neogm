/**
 * Data Access Layer for Neo4j - exports the core components
 */
export * from './connection-config';
export * from './connection-manager';
export * from './session-manager';
export * from './query-runner';
export declare const Neo4j: {
    authTokenManagers: import("neo4j-driver").AuthTokenManagers;
    driver: typeof import("neo4j-driver").driver;
    hasReachableServer: typeof import("neo4j-driver").hasReachableServer;
    int: typeof import("neo4j-driver").Integer.fromValue;
    isInt: typeof import("neo4j-driver").Integer.isInteger;
    integer: {
        toNumber: typeof import("neo4j-driver").Integer.toNumber;
        toString: typeof import("neo4j-driver").Integer.toString;
        inSafeRange: typeof import("neo4j-driver").Integer.inSafeRange;
    };
    auth: {
        basic: (username: string, password: string, realm?: string) => import("neo4j-driver").AuthToken;
        kerberos: (base64EncodedTicket: string) => import("neo4j-driver").AuthToken;
        bearer: (base64EncodedToken: string) => import("neo4j-driver").AuthToken;
        custom: (principal: string, credentials: string, realm: string, scheme: string, parameters?: import("neo4j-driver/types/query-runner").Parameters) => import("neo4j-driver").AuthToken;
    };
    types: {
        Node: typeof import("neo4j-driver").Node;
        Relationship: typeof import("neo4j-driver").Relationship;
        UnboundRelationship: typeof import("neo4j-driver").UnboundRelationship;
        PathSegment: typeof import("neo4j-driver").PathSegment;
        Path: typeof import("neo4j-driver").Path;
        Result: typeof import("neo4j-driver").Result;
        EagerResult: typeof import("neo4j-driver").EagerResult;
        ResultSummary: typeof import("neo4j-driver").ResultSummary;
        Record: typeof import("neo4j-driver").Record;
        Point: typeof import("neo4j-driver").Point;
        Duration: typeof import("neo4j-driver").Duration;
        LocalTime: typeof import("neo4j-driver").LocalTime;
        Time: typeof import("neo4j-driver").Time;
        Date: typeof import("neo4j-driver").Date;
        LocalDateTime: typeof import("neo4j-driver").LocalDateTime;
        DateTime: typeof import("neo4j-driver").DateTime;
        Integer: typeof import("neo4j-driver").Integer;
        RxSession: typeof import("neo4j-driver").RxSession;
        RxTransaction: typeof import("neo4j-driver").RxTransaction;
        RxManagedTransaction: typeof import("neo4j-driver").RxManagedTransaction;
        RxResult: typeof import("neo4j-driver").RxResult;
    };
    session: {
        READ: import("neo4j-driver-core/types/types").SessionMode;
        WRITE: import("neo4j-driver-core/types/types").SessionMode;
    };
    routing: {
        WRITE: "WRITE";
        READ: "READ";
    };
    error: {
        SERVICE_UNAVAILABLE: string;
        SESSION_EXPIRED: string;
        PROTOCOL_ERROR: string;
    };
    graph: {
        isNode: typeof import("neo4j-driver").isNode;
        isPath: typeof import("neo4j-driver").isPath;
        isPathSegment: typeof import("neo4j-driver").isPathSegment;
        isRelationship: typeof import("neo4j-driver").isRelationship;
        isUnboundRelationship: typeof import("neo4j-driver").isUnboundRelationship;
    };
    spatial: {
        isPoint: typeof import("neo4j-driver").isPoint;
    };
    temporal: {
        isDuration: typeof import("neo4j-driver").isDuration;
        isLocalTime: typeof import("neo4j-driver").isLocalTime;
        isTime: typeof import("neo4j-driver").isTime;
        isDate: typeof import("neo4j-driver").isDate;
        isLocalDateTime: typeof import("neo4j-driver").isLocalDateTime;
        isDateTime: typeof import("neo4j-driver").isDateTime;
    };
    Driver: typeof import("neo4j-driver").Driver;
    AuthToken: import("neo4j-driver").AuthToken;
    Config: import("neo4j-driver").Config;
    EncryptionLevel: import("neo4j-driver").EncryptionLevel;
    TrustStrategy: import("neo4j-driver").TrustStrategy;
    SessionMode: import("neo4j-driver").SessionMode;
    Neo4jError: typeof import("neo4j-driver").Neo4jError;
    isRetriableError: typeof import("neo4j-driver").Neo4jError.isRetriable;
    Node: typeof import("neo4j-driver").Node;
    Relationship: typeof import("neo4j-driver").Relationship;
    UnboundRelationship: typeof import("neo4j-driver").UnboundRelationship;
    PathSegment: typeof import("neo4j-driver").PathSegment;
    Path: typeof import("neo4j-driver").Path;
    Integer: typeof import("neo4j-driver").Integer;
    Record: typeof import("neo4j-driver").Record;
    Result: typeof import("neo4j-driver").Result;
    EagerResult: typeof import("neo4j-driver").EagerResult;
    QueryResult: import("neo4j-driver").QueryResult;
    ResultObserver: import("neo4j-driver").ResultObserver;
    ResultSummary: typeof import("neo4j-driver").ResultSummary;
    Plan: typeof import("neo4j-driver").Plan;
    ProfiledPlan: typeof import("neo4j-driver").ProfiledPlan;
    QueryStatistics: typeof import("neo4j-driver").QueryStatistics;
    Notification: typeof import("neo4j-driver").Notification;
    GqlStatusObject: typeof import("neo4j-driver").GqlStatusObject;
    ServerInfo: typeof import("neo4j-driver").ServerInfo;
    NotificationPosition: import("neo4j-driver").NotificationPosition;
    Session: typeof import("neo4j-driver").Session;
    Transaction: typeof import("neo4j-driver").Transaction;
    ManagedTransaction: typeof import("neo4j-driver").ManagedTransaction;
    Point: typeof import("neo4j-driver").Point;
    isPoint: typeof import("neo4j-driver").isPoint;
    Duration: typeof import("neo4j-driver").Duration;
    LocalTime: typeof import("neo4j-driver").LocalTime;
    Time: typeof import("neo4j-driver").Time;
    Date: typeof import("neo4j-driver").Date;
    LocalDateTime: typeof import("neo4j-driver").LocalDateTime;
    DateTime: typeof import("neo4j-driver").DateTime;
    RxSession: typeof import("neo4j-driver").RxSession;
    RxTransaction: typeof import("neo4j-driver").RxTransaction;
    RxManagedTransaction: typeof import("neo4j-driver").RxManagedTransaction;
    RxResult: typeof import("neo4j-driver").RxResult;
    isDuration: typeof import("neo4j-driver").isDuration;
    isLocalTime: typeof import("neo4j-driver").isLocalTime;
    isTime: typeof import("neo4j-driver").isTime;
    isDate: typeof import("neo4j-driver").isDate;
    isLocalDateTime: typeof import("neo4j-driver").isLocalDateTime;
    isDateTime: typeof import("neo4j-driver").isDateTime;
    isNode: typeof import("neo4j-driver").isNode;
    isPath: typeof import("neo4j-driver").isPath;
    isPathSegment: typeof import("neo4j-driver").isPathSegment;
    isRelationship: typeof import("neo4j-driver").isRelationship;
    isUnboundRelationship: typeof import("neo4j-driver").isUnboundRelationship;
    bookmarkManager: typeof import("neo4j-driver").bookmarkManager;
    resultTransformers: {
        eagerResultTransformer<Entries extends import("neo4j-driver").RecordShape = import("neo4j-driver").RecordShape>(): import("neo4j-driver").ResultTransformer<import("neo4j-driver").EagerResult<Entries>>;
        eager<Entries extends import("neo4j-driver").RecordShape = import("neo4j-driver").RecordShape>(): import("neo4j-driver").ResultTransformer<import("neo4j-driver").EagerResult<Entries>>;
        mappedResultTransformer<R = import("neo4j-driver").Record<import("neo4j-driver").RecordShape<PropertyKey, any>, PropertyKey, import("neo4j-driver").RecordShape<PropertyKey, number>>, T = {
            records: R[];
            keys: string[];
            summary: import("neo4j-driver").ResultSummary;
        }>(config: {
            map?: (rec: import("neo4j-driver").Record) => R | undefined;
            collect?: (records: R[], summary: import("neo4j-driver").ResultSummary, keys: string[]) => T;
        }): import("neo4j-driver").ResultTransformer<T>;
        mapped<R = import("neo4j-driver").Record<import("neo4j-driver").RecordShape<PropertyKey, any>, PropertyKey, import("neo4j-driver").RecordShape<PropertyKey, number>>, T = {
            records: R[];
            keys: string[];
            summary: import("neo4j-driver").ResultSummary;
        }>(config: {
            map?: (rec: import("neo4j-driver").Record) => R | undefined;
            collect?: (records: R[], summary: import("neo4j-driver").ResultSummary, keys: string[]) => T;
        }): import("neo4j-driver").ResultTransformer<T>;
        first<Entries extends import("neo4j-driver").RecordShape = import("neo4j-driver").RecordShape>(): import("neo4j-driver").ResultTransformer<import("neo4j-driver").Record<Entries> | undefined>;
        summary<T extends import("neo4j-driver-core").NumberOrInteger = import("neo4j-driver").Integer>(): import("neo4j-driver").ResultTransformer<import("neo4j-driver").ResultSummary<T>>;
    };
    notificationCategory: {
        HINT: "HINT";
        UNRECOGNIZED: "UNRECOGNIZED";
        UNSUPPORTED: "UNSUPPORTED";
        PERFORMANCE: "PERFORMANCE";
        TOPOLOGY: "TOPOLOGY";
        SECURITY: "SECURITY";
        DEPRECATION: "DEPRECATION";
        GENERIC: "GENERIC";
        SCHEMA: "SCHEMA";
        UNKNOWN: "UNKNOWN";
    };
    notificationClassification: {
        UNKNOWN: "UNKNOWN";
        HINT: "HINT";
        UNRECOGNIZED: "UNRECOGNIZED";
        UNSUPPORTED: "UNSUPPORTED";
        PERFORMANCE: "PERFORMANCE";
        TOPOLOGY: "TOPOLOGY";
        SECURITY: "SECURITY";
        DEPRECATION: "DEPRECATION";
        GENERIC: "GENERIC";
        SCHEMA: "SCHEMA";
    };
    notificationSeverityLevel: {
        UNKNOWN: "UNKNOWN";
        WARNING: "WARNING";
        INFORMATION: "INFORMATION";
    };
    notificationFilterDisabledCategory: {
        HINT: "HINT";
        UNRECOGNIZED: "UNRECOGNIZED";
        UNSUPPORTED: "UNSUPPORTED";
        PERFORMANCE: "PERFORMANCE";
        TOPOLOGY: "TOPOLOGY";
        SECURITY: "SECURITY";
        DEPRECATION: "DEPRECATION";
        GENERIC: "GENERIC";
        SCHEMA: "SCHEMA";
    };
    notificationFilterDisabledClassification: {
        HINT: "HINT";
        UNRECOGNIZED: "UNRECOGNIZED";
        UNSUPPORTED: "UNSUPPORTED";
        PERFORMANCE: "PERFORMANCE";
        TOPOLOGY: "TOPOLOGY";
        SECURITY: "SECURITY";
        DEPRECATION: "DEPRECATION";
        GENERIC: "GENERIC";
        SCHEMA: "SCHEMA";
    };
    notificationFilterMinimumSeverityLevel: {
        WARNING: "WARNING";
        INFORMATION: "INFORMATION";
        OFF: "OFF";
    };
    logging: {
        console: (level: import("neo4j-driver-core/types/types").LogLevel) => {
            level: import("neo4j-driver-core/types/types").LogLevel;
            logger: (level: import("neo4j-driver-core/types/types").LogLevel, message: string) => void;
        };
    };
    clientCertificateProviders: import("neo4j-driver").ClientCertificateProviders;
};
import { ConnectionManager } from './connection-manager';
import { SessionManager } from './session-manager';
import { QueryRunner } from './query-runner';
/**
 * Initialize the Neo4j connection
 * @param config Neo4j connection configuration
 */
export declare function initNeo4j(config: any): void;
/**
 * Get the connection manager instance
 */
export declare function getConnectionManager(): ConnectionManager;
/**
 * Get the session manager instance
 */
export declare function getSessionManager(): SessionManager;
/**
 * Get the query runner instance
 */
export declare function getQueryRunner(): QueryRunner;
/**
 * Run a direct query against Neo4j
 * @param query Cypher query string
 * @param params Query parameters
 * @returns Query result
 */
export declare function runQuery<T = any>(query: string, params?: Record<string, any>): Promise<T[]>;
/**
 * Clean up all Neo4j connections and sessions
 */
export declare function closeNeo4j(): Promise<void>;
//# sourceMappingURL=index.d.ts.map