/**
 * Integration tests for multi-database connection support
 *
 * These tests verify that our implementation can handle multiple database
 * connections within a single Neo4j instance.
 */

import {
  ConnectionManager,
  MultiDatabaseConfig,
  QueryRunner,
  SessionManager,
  initNeo4j,
} from "../../index";

// Define global for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __SUPPORTS_MULTI_DB__: boolean;
}

describe("Multi-Database Connections", () => {
  const connectionManager = ConnectionManager.getInstance();
  const sessionManager = SessionManager.getInstance();

  // Configuration for multiple databases within Neo4j
  const multiDbConfig: MultiDatabaseConfig<"primary" | "secondary"> = {
    default: "primary",
    databases: {
      primary: {
        name: "primary",
        uri: "neo4j://localhost:7687",
        auth: {
          username: "neo4j",
          password: "testpassword",
        },
      },
      secondary: {
        name: "secondary",
        uri: "neo4j://localhost:7687", // Same instance, different logical database
        auth: {
          username: "neo4j",
          password: "testpassword",
        },
      },
    },
  };

  beforeAll(async () => {
    // Re-initialize with multi-database config
    // The setup will have already initialized with a standard config,
    // but we can re-initialize to test multi-db support

    // Close existing connections first
    await connectionManager.closeAll();

    // Initialize with multi-db config
    initNeo4j(multiDbConfig);
  });

  afterAll(async () => {
    await connectionManager.closeAll();
  });

  beforeEach(async () => {
    // Clean the primary database before each test
    await sessionManager.run(
      "MATCH (n) DETACH DELETE n",
      {},
      { database: "primary" }
    );

    await sessionManager.run(
      "MATCH (n) DETACH DELETE n",
      {},
      { database: "secondary" }
    );
  });

  it("should connect to the default database", async () => {
    // Using the default database (primary)
    const session = sessionManager.getSession();

    try {
      // Create a test node in the primary database
      await session.run("CREATE (p:Person {name: $name}) RETURN p", {
        name: "Alice",
      });

      // Verify node exists in primary
      const result = await session.run(
        "MATCH (p:Person {name: $name}) RETURN p",
        { name: "Alice" }
      );
      expect(result.records).toHaveLength(1);
      expect(result.records[0].get("p").properties.name).toBe("Alice");
    } finally {
      await session.close();
    }
  });

  it("should support database-specific sessions", async () => {
    // Create session for primary database
    const primarySession = sessionManager.getSession({ database: "primary" });

    // Create session for secondary database
    const secondarySession = sessionManager.getSession({
      database: "secondary",
    });

    try {
      // Create a node in primary
      await primarySession.run("CREATE (p:Person {name: $name}) RETURN p", {
        name: "Bob",
      });

      // Create a node in secondary
      await secondarySession.run("CREATE (p:Person {name: $name}) RETURN p", {
        name: "Charlie",
      });

      // Verify node exists only in primary
      const primaryResult = await primarySession.run(
        "MATCH (p:Person {name: $name}) RETURN p",
        { name: "Bob" }
      );
      expect(primaryResult.records).toHaveLength(1);

      // Node shouldn't exist in primary with name Charlie
      const primaryCharlie = await primarySession.run(
        "MATCH (p:Person {name: $name}) RETURN p",
        { name: "Charlie" }
      );
      expect(primaryCharlie.records).toHaveLength(0);

      // Verify node exists only in secondary
      const secondaryResult = await secondarySession.run(
        "MATCH (p:Person {name: $name}) RETURN p",
        { name: "Charlie" }
      );
      expect(secondaryResult.records).toHaveLength(1);

      // Node shouldn't exist in secondary with name Bob
      const secondaryBob = await secondarySession.run(
        "MATCH (p:Person {name: $name}) RETURN p",
        { name: "Bob" }
      );
      expect(secondaryBob.records).toHaveLength(0);
    } finally {
      await primarySession.close();
      await secondarySession.close();
    }
  });

  it("should support database-specific query execution", async () => {
    // Skip test since multi-database requires paid Neo4j version
    if (!global.__SUPPORTS_MULTI_DB__) {
      console.log("Skipping multi-database test - requires paid Neo4j version");
      return;
    }

    // Create test data in primary database
    await sessionManager.run(
      "CREATE (p:Person {name: $name}) RETURN p",
      { name: "Dave" },
      { database: "primary" }
    );

    // Create test data in secondary database
    await sessionManager.run(
      "CREATE (p:Person {name: $name}) RETURN p",
      { name: "Eve" },
      { database: "secondary" }
    );

    // Query from primary database
    const primaryResult = await QueryRunner.getInstance().run<{ p: any }>(
      "MATCH (p:Person {name: $name}) RETURN p",
      { name: "Dave" },
      undefined,
      { database: "primary" }
    );

    expect(primaryResult).toHaveLength(1);
    expect(primaryResult[0].p.properties.name).toBe("Dave");

    // Query from secondary database
    const secondaryResult = await QueryRunner.getInstance().run<{ p: any }>(
      "MATCH (p:Person {name: $name}) RETURN p",
      { name: "Eve" },
      undefined,
      { database: "secondary" }
    );

    expect(secondaryResult).toHaveLength(1);
    expect(secondaryResult[0].p.properties.name).toBe("Eve");

    // Verify cross-database isolation
    const primaryEve = await QueryRunner.getInstance().run<{ p: any }>(
      "MATCH (p:Person {name: $name}) RETURN p",
      { name: "Eve" },
      undefined,
      { database: "primary" }
    );

    expect(primaryEve).toHaveLength(0);

    const secondaryDave = await QueryRunner.getInstance().run<{ p: any }>(
      "MATCH (p:Person {name: $name}) RETURN p",
      { name: "Dave" },
      undefined,
      { database: "secondary" }
    );

    expect(secondaryDave).toHaveLength(0);
  });

  it("should maintain independent connections for different databases", async () => {
    // Skip test since multi-database requires paid Neo4j version
    if (!global.__SUPPORTS_MULTI_DB__) {
      console.log("Skipping multi-database test - requires paid Neo4j version");
      return;
    }

    // Get drivers for both databases
    const primaryDriver = connectionManager.getDriverForDatabase("primary");
    const secondaryDriver = connectionManager.getDriverForDatabase("secondary");

    // These should be different driver instances
    expect(primaryDriver).not.toBe(secondaryDriver);

    // Verify the drivers map has both databases
    // @ts-ignore - Accessing private property for testing
    expect(connectionManager.drivers.size).toBe(2);

    // Create sessions from each driver
    const primarySession = primaryDriver.session();
    const secondarySession = secondaryDriver.session();

    try {
      // Execute test queries
      await primarySession.run("RETURN 1 as num");
      await secondarySession.run("RETURN 2 as num");
    } finally {
      await primarySession.close();
      await secondarySession.close();
    }
  });

  it("should support multiple connection configurations", async () => {
    // This test verifies we can reinitialize with a different configuration

    // Close existing connections
    await connectionManager.closeAll();

    // Initialize with a different config
    const newConfig = {
      uri: "neo4j://localhost:7687",
      auth: {
        username: "neo4j",
        password: "testpassword",
      },
    };

    initNeo4j(newConfig);

    // Test the new connection
    const session = sessionManager.getSession();

    try {
      const result = await session.run("RETURN 1 as num");
      expect(result.records[0].get("num").toNumber()).toBe(1);
    } finally {
      await session.close();
    }

    // Cleanup - restore multi-db config for other tests
    await connectionManager.closeAll();
    initNeo4j(multiDbConfig);
  });
});
