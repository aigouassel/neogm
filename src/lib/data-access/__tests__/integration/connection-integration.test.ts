/**
 * Integration tests for Neo4j connection
 *
 * These tests connect to a real Neo4j instance running in Docker.
 */

import { getQueryRunner, getSessionManager, runQuery } from "../../index";

describe("Neo4j Connection Integration", () => {
  it("should connect to Neo4j and execute a simple query", async () => {
    // Get a session
    const session = getSessionManager().getSession();

    try {
      // Run a simple query
      const result = await session.run("RETURN 1 + 1 as sum");

      // Verify result
      expect(result.records).toHaveLength(1);
      expect(result.records[0].get("sum").toNumber()).toBe(2);
    } finally {
      // Close session
      await session.close();
    }
  });

  it("should run a query using the query runner", async () => {
    // Use the query runner
    const result = await getQueryRunner().run<{ sum: number }>(
      "RETURN 1 + 1 as sum"
    );

    // Verify result
    expect(result).toHaveLength(1);
    expect(result[0].sum).toBe(2);
  });

  it("should run a query using the convenience function", async () => {
    // Use the convenience function
    const result = await runQuery<{ sum: number }>("RETURN 1 + 1 as sum");

    // Verify result
    expect(result).toHaveLength(1);
    expect(result[0].sum).toBe(2);
  });

  it("should create a node and retrieve it", async () => {
    // Create a test node
    await runQuery("CREATE (p:Person {name: $name, age: $age}) RETURN p", {
      name: "Alice",
      age: 30,
    });

    // Retrieve the node
    const result = await runQuery<{ name: string; age: number }>(
      "MATCH (p:Person {name: $name}) RETURN p",
      { name: "Alice" }
    );

    // Verify node properties
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice");
    expect(result[0].age).toBe(30);

    // Clean up
    await runQuery("MATCH (p:Person {name: $name}) DELETE p", {
      name: "Alice",
    });
  });

  it("should handle transactions", async () => {
    // Get a session
    const session = getSessionManager().getSession();

    try {
      // Start a transaction
      const tx = session.beginTransaction();

      try {
        // Create a node in the transaction
        await tx.run("CREATE (p:Person {name: $name, age: $age}) RETURN p", {
          name: "Bob",
          age: 25,
        });

        // Commit the transaction
        await tx.commit();
      } catch (error) {
        // Rollback on error
        await tx.rollback();
        throw error;
      }

      // Verify the node was created
      const result = await session.run(
        "MATCH (p:Person {name: $name}) RETURN p",
        { name: "Bob" }
      );

      expect(result.records).toHaveLength(1);
      expect(result.records[0].get("p").properties.name).toBe("Bob");

      // Clean up
      await session.run("MATCH (p:Person {name: $name}) DELETE p", {
        name: "Bob",
      });
    } finally {
      // Close session
      await session.close();
    }
  });
});
