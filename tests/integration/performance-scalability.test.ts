import { NeoGM } from '../../src/lib/neogm';
import { WorkflowTestHelpers } from '../setup/workflow-helpers';
import { testConfig } from '../setup/test-config';
import { User, Company } from '../models/test-entities';

describe('Performance and Scalability Integration Tests', () => {
  let neogm: NeoGM;
  let helpers: WorkflowTestHelpers;

  beforeAll(async () => {
    neogm = new NeoGM(testConfig);
    await neogm.connect();
    helpers = new WorkflowTestHelpers(neogm);
  });

  beforeEach(async () => {
    await neogm.clearDatabase();
  });

  afterAll(async () => {
    await neogm.disconnect();
  });

  it('should handle complex multi-entity operations efficiently', async () => {
    console.log('🚀 Testing performance and scalability...');
    
    const startTime = Date.now();

    // Create baseline company for comparison
    await helpers.createCompanyFoundation();
    const setupTime = Date.now() - startTime;

    // Create performance test data
    const queryStartTime = Date.now();
    const { companies, users, projects } = await helpers.createPerformanceTestData();
    const setupTime2 = Date.now() - queryStartTime;

    // Verify data creation
    expect(companies).toHaveLength(5);
    expect(users).toHaveLength(25);
    expect(projects).toHaveLength(10);

    // Test complex analytical queries on larger dataset
    const analyticsStartTime = Date.now();

    // 1. Multi-company analysis
    const results = await Promise.all([
      // Company statistics
      neogm.queryBuilder()
        .match('(c:Company)<-[:WORKS_AT]-(u:User)')
        .return('c.name as company, c.industry as industry, count(u) as employees')
        .execute(),

      // Cross-company project distribution
      neogm.queryBuilder()
        .match('(c:Company)-[:OWNS]->(p:Project)')
        .return('c.industry as industry, count(p) as projects')
        .execute(),

      // User distribution by company size
      neogm.queryBuilder()
        .match('(c:Company)<-[:WORKS_AT]-(u:User)')
        .return('c.size as companySize, count(u) as employees')
        .execute(),

      // Industry analysis
      neogm.queryBuilder()
        .match('(c:Company)')
        .return('c.industry as industry, count(c) as companyCount')
        .execute(),

      // Project budget analysis
      neogm.queryBuilder()
        .match('(p:Project)')
        .return('avg(p.budget) as avgBudget, sum(p.budget) as totalBudget, count(p) as projectCount')
        .execute()
    ]);

    const queryTime = Date.now() - analyticsStartTime;

    // Verify results
    expect(results[0].records).toHaveLength(6); // All companies should have data (5 + original TechCorp)
    expect(results[3].records).toHaveLength(5); // All industries should be represented

    // Performance assertions
    expect(setupTime).toBeLessThan(5000); // Setup should complete within 5 seconds
    expect(queryTime).toBeLessThan(2000); // Queries should complete within 2 seconds

    console.log(`Performance metrics:
        - Setup time: ${setupTime}ms
        - Data creation time: ${setupTime2}ms
        - Query time: ${queryTime}ms
        - Total time: ${setupTime + setupTime2 + queryTime}ms
        - Entities created: 40
        - Relationships created: ~50`);

    console.log('✅ Performance and scalability tests completed successfully!');
  });

  it('should handle concurrent operations efficiently', async () => {
    console.log('⚡ Testing concurrent operations...');

    // Create baseline data
    await helpers.createCompanyFoundation();

    const startTime = Date.now();

    // Simulate concurrent read operations
    const concurrentReads = Array.from({ length: 10 }, (_, i) => 
      neogm.queryBuilder()
        .match('(u:User)-[:WORKS_AT]->(c:Company)')
        .where({ 'c.name': 'TechCorp Innovation Labs' })
        .return(`u.username as username, u.firstName as firstName, ${i} as queryId`)
        .execute()
    );

    const readResults = await Promise.all(concurrentReads);
    const readTime = Date.now() - startTime;

    // Verify all reads succeeded
    readResults.forEach((result, index) => {
      expect(result.records).toHaveLength(5);
      expect(result.records[0].queryId).toBe(index);
    });

    // Test concurrent write operations (sequential to avoid conflicts)
    const writeStartTime = Date.now();
    const userRepo = neogm.getRepository(User);

    const writes = [];
    for (let i = 0; i < 5; i++) {
      const user = await userRepo.create({
        username: `concurrent_user_${i}`,
        email: `concurrent${i}@test.com`,
        firstName: `Concurrent`,
        lastName: `User${i}`,
        age: 25 + i
      });
      writes.push(user.save());
    }

    await Promise.all(writes);
    const writeTime = Date.now() - writeStartTime;

    // Verify writes
    const verifyUsers = await neogm.queryBuilder()
      .match('(u:User)')
      .where('u.username STARTS WITH "concurrent_user_"')
      .return('count(u) as userCount')
      .execute();

    expect(verifyUsers.records[0].userCount).toBe(5);

    // Performance assertions
    expect(readTime).toBeLessThan(3000); // Concurrent reads should complete within 3 seconds
    expect(writeTime).toBeLessThan(5000); // Sequential writes should complete within 5 seconds

    console.log(`Concurrency metrics:
        - Concurrent reads (10): ${readTime}ms
        - Sequential writes (5): ${writeTime}ms
        - Average read time: ${readTime / 10}ms
        - Average write time: ${writeTime / 5}ms`);

    console.log('✅ Concurrent operations test completed successfully!');
  });

  it('should handle bulk operations and large datasets', async () => {
    console.log('📦 Testing bulk operations...');

    const startTime = Date.now();

    // Create bulk data using transactions
    const bulkUsers = [];
    const bulkCompanies = [];

    // Bulk company creation
    for (let i = 1; i <= 10; i++) {
      const company = await neogm.getRepository(Company).create({
        name: `Bulk Company ${i}`,
        industry: ['Technology', 'Finance'][i % 2],
        foundedYear: 2010 + i,
        size: 'medium'
      });
      await company.save();
      bulkCompanies.push(company);
    }

    // Bulk user creation with employment relationships
    for (let i = 1; i <= 50; i++) {
      const user = await neogm.getRepository(User).create({
        username: `bulk_user_${i}`,
        email: `bulk${i}@test.com`,
        firstName: `Bulk`,
        lastName: `User${i}`,
        age: 20 + (i % 30)
      });
      await user.save();
      bulkUsers.push(user);

      // Create employment relationship
      const companyIndex = i % bulkCompanies.length;
      await neogm.rawQuery().execute(`
        MATCH (u:User), (c:Company)
        WHERE ID(u) = $userId AND ID(c) = $companyId
        CREATE (u)-[:WORKS_AT {position: 'Employee', startDate: '2023-01-01'}]->(c)
      `, {
        userId: user.getId(),
        companyId: bulkCompanies[companyIndex].getId()
      });
    }

    const bulkTime = Date.now() - startTime;

    // Test queries on large dataset
    const queryStartTime = Date.now();

    const largeDatesetQueries = await Promise.all([
      // Count all entities
      neogm.queryBuilder()
        .match('(n)')
        .return('count(n) as totalNodes')
        .execute(),

      // Analyze employment distribution
      neogm.queryBuilder()
        .match('(u:User)-[:WORKS_AT]->(c:Company)')
        .return('c.name as company, count(u) as employees')
        .orderBy('employees', 'DESC')
        .execute(),

      // Industry analysis
      neogm.queryBuilder()
        .match('(c:Company)')
        .return('c.industry as industry, count(c) as companies, avg(c.foundedYear) as avgFounded')
        .execute(),

      // Age demographics
      neogm.queryBuilder()
        .match('(u:User)')
        .return('min(u.age) as minAge, max(u.age) as maxAge, avg(u.age) as avgAge')
        .execute()
    ]);

    const queryTime = Date.now() - queryStartTime;

    // Verify bulk operations
    expect(largeDatesetQueries[0].records[0].totalNodes).toBeGreaterThanOrEqual(60); // 50 users + 10 companies + relationships
    expect(largeDatesetQueries[1].records).toHaveLength(10); // 10 companies
    expect(largeDatesetQueries[2].records).toHaveLength(2); // 2 industries

    // Performance assertions for bulk operations
    expect(bulkTime).toBeLessThan(30000); // Bulk operations should complete within 30 seconds
    expect(queryTime).toBeLessThan(5000); // Queries on large dataset should complete within 5 seconds

    console.log(`Bulk operations metrics:
        - Bulk creation time: ${bulkTime}ms
        - Large dataset query time: ${queryTime}ms
        - Users created: ${bulkUsers.length}
        - Companies created: ${bulkCompanies.length}
        - Relationships created: ${bulkUsers.length}
        - Average time per entity: ${bulkTime / (bulkUsers.length + bulkCompanies.length)}ms`);

    console.log('✅ Bulk operations test completed successfully!');
  });

  it('should maintain performance under stress conditions', async () => {
    console.log('💪 Testing stress conditions...');

    // Create moderate dataset
    await helpers.createCompanyFoundation();

    const stressStartTime = Date.now();

    // Simulate stress conditions with rapid queries
    const stressQueries = [];
    
    // Create 20 rapid-fire queries of different types
    for (let i = 0; i < 20; i++) {
      const queryType = i % 4;
      
      switch (queryType) {
        case 0: // User queries
          stressQueries.push(
            neogm.queryBuilder()
              .match('(u:User)')
              .return('u.username as username, u.age as age')
              .limit(10)
              .execute()
          );
          break;
        case 1: // Relationship queries
          stressQueries.push(
            neogm.queryBuilder()
              .match('(u:User)-[r]->(n)')
              .return('type(r) as relType, count(*) as count')
              .execute()
          );
          break;
        case 2: // Complex joins
          stressQueries.push(
            neogm.queryBuilder()
              .match('(u:User)-[:WORKS_AT]->(c:Company)<-[:WORKS_AT]-(colleague:User)')
              .where('u.username <> colleague.username')
              .return('u.username as user, count(colleague) as colleagues')
              .execute()
          );
          break;
        case 3: // Aggregations
          stressQueries.push(
            neogm.queryBuilder()
              .match('(n)')
              .return('labels(n) as nodeType, count(n) as count')
              .execute()
          );
          break;
      }
    }

    const stressResults = await Promise.all(stressQueries);
    const stressTime = Date.now() - stressStartTime;

    // Verify all stress queries succeeded
    stressResults.forEach((result, index) => {
      expect(result.records).toBeDefined();
      expect(Array.isArray(result.records)).toBe(true);
    });

    // Performance assertions for stress conditions
    expect(stressTime).toBeLessThan(10000); // Stress test should complete within 10 seconds
    expect(stressResults.length).toBe(20); // All queries should complete

    console.log(`Stress test metrics:
        - Total stress time: ${stressTime}ms
        - Queries executed: ${stressResults.length}
        - Average query time: ${stressTime / stressResults.length}ms
        - Queries per second: ${(stressResults.length / stressTime * 1000).toFixed(2)}`);

    console.log('✅ Stress test completed successfully!');
  });
});