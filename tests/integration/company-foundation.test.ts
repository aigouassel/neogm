import { NeoGM } from '../../src/lib/neogm';
import { User, Company, Team, Post, Comment, Project } from '../models/test-entities';
import { WorkflowTestHelpers, WorkflowData } from '../setup/workflow-helpers';
import { testConfig } from '../setup/test-config';

describe('Company Foundation Integration Tests', () => {
  let neogm: NeoGM;
  let helpers: WorkflowTestHelpers;
  let workflowData: WorkflowData;

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

  it('should create a complete tech company workflow from scratch', async () => {
    console.log('🏢 Creating company foundation...');
    
    // Create complete company setup
    workflowData = await helpers.createCompanyFoundation();
    
    // === VERIFICATION PHASE ===
    
    // Verify company creation
    expect(workflowData.company.getId()).toBeDefined();
    expect(workflowData.company.name).toBe('TechCorp Innovation Labs');
    expect(workflowData.company.industry).toBe('Technology');
    
    // Verify teams
    expect(workflowData.teams.engineering.name).toBe('Engineering');
    expect(workflowData.teams.product.name).toBe('Product');
    
    // Verify users
    expect(workflowData.users.cto.username).toBe('cto_sarah');
    expect(workflowData.users.engineer1.username).toBe('dev_mike');
    expect(workflowData.users.engineer2.username).toBe('dev_emily');
    
    // Verify organizational structure
    const companyTeams = await neogm.queryBuilder()
      .match('(c:Company)-[:HAS_TEAM]->(t:Team)')
      .where({ 'c.name': 'TechCorp Innovation Labs' })
      .return('t.name as teamName, t.department as department')
      .execute();
    
    expect(companyTeams.records).toHaveLength(2);
    expect(companyTeams.records.some(r => r.teamName === 'Engineering')).toBe(true);
    expect(companyTeams.records.some(r => r.teamName === 'Product')).toBe(true);
    
    // Verify employment relationships
    const employees = await neogm.queryBuilder()
      .match('(u:User)-[works:WORKS_AT]->(c:Company)')
      .where({ 'c.name': 'TechCorp Innovation Labs' })
      .return('u.username as username, works.position as position, works.department as department')
      .execute();
    
    expect(employees.records).toHaveLength(5);
    expect(employees.records.some(e => e.username === 'cto_sarah' && e.position === 'Chief Technology Officer')).toBe(true);
    expect(employees.records.some(e => e.username === 'dev_mike' && e.position === 'Senior Software Engineer')).toBe(true);
    
    // Verify team memberships
    const teamMembers = await neogm.queryBuilder()
      .match('(u:User)-[member:MEMBER_OF]->(t:Team)')
      .return('u.username as username, t.name as teamName, member.role as role')
      .execute();
    
    expect(teamMembers.records).toHaveLength(5);
    expect(teamMembers.records.some(m => m.username === 'cto_sarah' && m.teamName === 'Engineering' && m.role === 'CTO')).toBe(true);
    
    // Verify social network
    const followers = await neogm.queryBuilder()
      .match('(follower:User)-[:FOLLOWS]->(followee:User)')
      .return('follower.username as follower, followee.username as followee')
      .execute();
    
    expect(followers.records.length).toBeGreaterThan(0);
    expect(followers.records.some(f => f.follower === 'dev_mike' && f.followee === 'cto_sarah')).toBe(true);
    
    // Verify project setup
    expect(workflowData.projects.mobileApp.name).toBe('Mobile Platform Initiative');
    expect(workflowData.projects.mobileApp.budget).toBe(750000);
    
    // Verify project assignments
    const projectAssignments = await neogm.queryBuilder()
      .match('(p:Project)-[assign:ASSIGNED_TO]->(u:User)')
      .where({ 'p.name': 'Mobile Platform Initiative' })
      .return('u.username as username, assign.role as role, assign.timeAllocation as allocation')
      .execute();
    
    expect(projectAssignments.records).toHaveLength(4);
    expect(projectAssignments.records.some(a => a.username === 'dev_mike' && a.role === 'Lead Developer')).toBe(true);
    
    // Verify knowledge sharing content
    expect(workflowData.posts).toHaveLength(3);
    expect(workflowData.comments).toHaveLength(4);
    
    // Verify post authorship
    const postAuthors = await neogm.queryBuilder()
      .match('(u:User)-[:CREATED]->(p:Post)')
      .return('u.username as author, p.title as title')
      .execute();
    
    expect(postAuthors.records).toHaveLength(3);
    expect(postAuthors.records.some(p => p.author === 'cto_sarah' && p.title.includes('Scaling Engineering Teams'))).toBe(true);
    
    // Verify post likes
    const postLikes = await neogm.queryBuilder()
      .match('(u:User)-[:LIKES]->(p:Post)')
      .return('count(*) as totalLikes')
      .execute();
    
    expect(postLikes.records[0].totalLikes).toBe(8);
    
    console.log('✅ Company foundation workflow completed successfully!');
    console.log(`Created: 1 company, 2 teams, 5 users, 1 project, ${workflowData.posts.length} posts, ${workflowData.comments.length} comments`);
  });

  it('should handle company scaling scenarios', async () => {
    // Create foundation
    workflowData = await helpers.createCompanyFoundation();
    
    // Simulate company scaling
    const userRepo = neogm.getRepository(User);
    const teamRepo = neogm.getRepository(Team);
    
    // Add new team (Marketing)
    const marketingTeam = await teamRepo.create({
      name: 'Marketing',
      description: 'Brand and customer acquisition team',
      department: 'Marketing',
      createdAt: new Date(),
      isActive: true
    });
    await marketingTeam.save();
    
    // Link to company
    await neogm.rawQuery().execute(`
      MATCH (c:Company), (t:Team)
      WHERE ID(c) = $companyId AND ID(t) = $teamId
      CREATE (c)-[:HAS_TEAM {establishedAt: $establishedAt}]->(t)
    `, {
      companyId: workflowData.company.getId(),
      teamId: marketingTeam.getId(),
      establishedAt: new Date().toISOString()
    });
    
    // Add new employees
    const marketingManager = await userRepo.create({
      username: 'marketing_lead',
      email: 'marketing@techcorp.com',
      firstName: 'Jessica',
      lastName: 'Smith',
      age: 32,
      bio: 'Marketing strategist with focus on tech products',
      isActive: true,
      tags: ['marketing', 'strategy', 'growth']
    });
    await marketingManager.save();
    
    // Verify scaling
    const allTeams = await neogm.queryBuilder()
      .match('(c:Company)-[:HAS_TEAM]->(t:Team)')
      .where({ 'c.name': 'TechCorp Innovation Labs' })
      .return('count(t) as teamCount')
      .execute();
    
    expect(allTeams.records[0].teamCount).toBe(3); // Original 2 + new Marketing team
    
    console.log('✅ Company scaling scenario completed successfully!');
  });

  it('should validate complex organizational queries', async () => {
    // Create foundation
    workflowData = await helpers.createCompanyFoundation();
    
    // Test complex organizational structure queries
    
    // 1. Department hierarchy
    const departmentStructure = await neogm.queryBuilder()
      .match('(c:Company)-[:HAS_TEAM]->(t:Team)<-[:MEMBER_OF]-(u:User)')
      .where({ 'c.name': 'TechCorp Innovation Labs' })
      .return('t.department as department, count(u) as memberCount')
      .orderBy('memberCount', 'DESC')
      .execute();
    
    expect(departmentStructure.records).toHaveLength(2);
    expect(departmentStructure.records[0].department).toBe('Technology'); // Engineering has more members
    expect(departmentStructure.records[0].memberCount).toBe(4);
    
    // 2. Cross-team collaboration potential
    const collaborationPotential = await neogm.queryBuilder()
      .match(`
        (u1:User)-[:MEMBER_OF]->(t1:Team),
        (u2:User)-[:MEMBER_OF]->(t2:Team),
        (u1)-[:FOLLOWS]->(u2)
      `)
      .where('t1.name <> t2.name')
      .return('t1.name as team1, t2.name as team2, count(*) as connections')
      .execute();
    
    expect(collaborationPotential.records.length).toBeGreaterThan(0);
    
    // 3. Project resource allocation
    const resourceAllocation = await neogm.queryBuilder()
      .match('(p:Project)-[assign:ASSIGNED_TO]->(u:User)-[:MEMBER_OF]->(t:Team)')
      .where({ 'p.name': 'Mobile Platform Initiative' })
      .return('t.name as team, avg(assign.timeAllocation) as avgAllocation, count(u) as memberCount')
      .execute();
    
    expect(resourceAllocation.records).toHaveLength(1);
    expect(resourceAllocation.records[0].team).toBe('Engineering');
    expect(resourceAllocation.records[0].memberCount).toBe(4);
    
    console.log('✅ Complex organizational queries validated successfully!');
  });
});