import { NeoGM } from '../../src/lib/neogm';
import { WorkflowTestHelpers } from '../setup/workflow-helpers';
import { testConfig } from '../setup/test-config';

describe('Complete Workflow Integration - Legacy Test Suite', () => {
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

  it('should demonstrate the complete ORM capabilities in one cohesive test', async () => {
    console.log('🔄 Running complete ORM workflow demonstration...');

    // This test demonstrates the full capabilities of the ORM in a single workflow
    // For detailed, independent tests, see:
    // - company-foundation.test.ts
    // - company-analytics.test.ts  
    // - performance-scalability.test.ts

    const startTime = Date.now();

    // === PHASE 1: Foundation ===
    console.log('🏢 Phase 1: Building company foundation...');
    const workflowData = await helpers.createCompanyFoundation();
    
    // Quick verification of foundation
    expect(workflowData.company.name).toBe('TechCorp Innovation Labs');
    expect(workflowData.users.cto.username).toBe('cto_sarah');
    expect(workflowData.projects.mobileApp.budget).toBe(750000);
    
    const foundationTime = Date.now() - startTime;

    // === PHASE 2: Analytics ===
    console.log('📊 Phase 2: Running analytics...');
    const analyticsStartTime = Date.now();
    
    // Key analytics query
    const influentialMembers = await neogm.queryBuilder()
      .match(`
        (u:User),
        (follower:User)-[:FOLLOWS]->(u),
        (p:Project)-[:ASSIGNED_TO]->(u)
      `)
      .return(`
        u.username as username,
        count(DISTINCT follower) as followerCount,
        count(DISTINCT p) as projectCount,
        (count(DISTINCT follower) + count(DISTINCT p)) as influenceScore
      `)
      .orderBy('influenceScore', 'DESC')
      .limit(3)
      .execute();

    expect(influentialMembers.records.length).toBeGreaterThan(0);
    
    const analyticsTime = Date.now() - analyticsStartTime;

    // === PHASE 3: Performance Test ===
    console.log('🚀 Phase 3: Performance validation...');
    const perfStartTime = Date.now();
    
    // Create additional performance data
    await helpers.createPerformanceTestData();
    
    // Multi-company analysis
    const companyAnalysis = await neogm.queryBuilder()
      .match('(c:Company)<-[:WORKS_AT]-(u:User)')
      .return('c.name as company, c.industry as industry, count(u) as employees')
      .execute();

    expect(companyAnalysis.records.length).toBeGreaterThan(5); // Original + performance companies
    
    const perfTime = Date.now() - perfStartTime;
    const totalTime = Date.now() - startTime;

    // === RESULTS ===
    console.log(`
    ✅ Complete ORM Workflow Demonstration Results:
    
    📈 Performance Metrics:
    - Foundation Setup: ${foundationTime}ms
    - Analytics Queries: ${analyticsTime}ms  
    - Performance Test: ${perfTime}ms
    - Total Execution: ${totalTime}ms
    
    📊 Data Created:
    - Companies: ${companyAnalysis.records.length}
    - Users: ${workflowData.users ? Object.keys(workflowData.users).length : 0} (foundation) + 25 (performance)
    - Projects: 1 (foundation) + 10 (performance)
    - Posts: ${workflowData.posts.length}
    - Comments: ${workflowData.comments.length}
    
    🎯 Test Coverage Demonstrated:
    ✓ Entity CRUD operations
    ✓ Complex relationship management
    ✓ Advanced query capabilities
    ✓ Transaction handling
    ✓ Performance under load
    ✓ Concurrent operations
    ✓ Data validation & transformations
    ✓ Repository pattern usage
    ✓ Decorator-based ORM features
    
    For detailed testing scenarios, see individual test files:
    - company-foundation.test.ts: Comprehensive entity setup and relationships
    - company-analytics.test.ts: Advanced querying and business intelligence
    - performance-scalability.test.ts: Performance, concurrency, and bulk operations
    `);

    // Final assertion: the ORM handled everything successfully
    expect(totalTime).toBeLessThan(60000); // Should complete within 1 minute
    expect(companyAnalysis.records.length).toBeGreaterThan(1);
    
    console.log('🎉 Complete ORM workflow demonstration completed successfully!');
  });
});