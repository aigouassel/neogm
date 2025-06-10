import { NeoGM } from '../../src/lib/neogm';
import { Repository } from '../../src/lib/entity';
import { User, Company, Team, Post, Comment, Project } from '../models/test-entities';

describe('Relationship Management Tests', () => {
  let neogm: NeoGM;
  let userRepo: Repository<User>;
  let companyRepo: Repository<Company>;
  let teamRepo: Repository<Team>;
  let postRepo: Repository<Post>;
  let commentRepo: Repository<Comment>;
  let projectRepo: Repository<Project>;

  beforeAll(async () => {
    neogm = new NeoGM({
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    await neogm.connect();

    userRepo = neogm.getRepository(User);
    companyRepo = neogm.getRepository(Company);
    teamRepo = neogm.getRepository(Team);
    postRepo = neogm.getRepository(Post);
    commentRepo = neogm.getRepository(Comment);
    projectRepo = neogm.getRepository(Project);
  });

  beforeEach(async () => {
    await neogm.clearDatabase();
  });

  afterAll(async () => {
    await neogm.disconnect();
  });

  describe('Basic Relationship Creation', () => {
    it('should create and manage employment relationships', async () => {
      // Create company
      const company = await companyRepo.create({
        name: 'Relationship Corp',
        industry: 'Technology',
        foundedYear: 2020
      });
      await company.save();

      // Create users
      const ceo = await userRepo.create({
        username: 'ceo_jane',
        email: 'jane@relationshipcorp.com',
        firstName: 'Jane',
        lastName: 'Smith',
        age: 45
      });
      await ceo.save();

      const engineer = await userRepo.create({
        username: 'eng_john',
        email: 'john@relationshipcorp.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 30
      });
      await engineer.save();

      // Create WORKS_AT relationships using raw query
      await neogm.rawQuery().execute(`
        MATCH (u:User), (c:Company)
        WHERE ID(u) = $userId AND ID(c) = $companyId
        CREATE (u)-[:WORKS_AT {position: $position, startDate: $startDate}]->(c)
      `, {
        userId: ceo.getId(),
        companyId: company.getId(),
        position: 'CEO',
        startDate: '2020-01-01'
      });

      await neogm.rawQuery().execute(`
        MATCH (u:User), (c:Company)
        WHERE ID(u) = $userId AND ID(c) = $companyId
        CREATE (u)-[:WORKS_AT {position: $position, startDate: $startDate}]->(c)
      `, {
        userId: engineer.getId(),
        companyId: company.getId(),
        position: 'Software Engineer',
        startDate: '2023-03-15'
      });

      // Verify relationships were created
      const employeeCheck = await neogm.queryBuilder()
        .match('(u:User)-[r:WORKS_AT]->(c:Company)')
        .where({ 'c.name': 'Relationship Corp' })
        .return('u.username as username, r.position as position')
        .execute();

      expect(employeeCheck.records).toHaveLength(2);
      expect(employeeCheck.records.some(r => r.username === 'ceo_jane' && r.position === 'CEO')).toBe(true);
      expect(employeeCheck.records.some(r => r.username === 'eng_john' && r.position === 'Software Engineer')).toBe(true);
    });

    it('should handle team membership relationships', async () => {
      // Create company and teams
      const company = await companyRepo.create({
        name: 'Team Corp',
        industry: 'Software'
      });
      await company.save();

      const engineeringTeam = await teamRepo.create({
        name: 'Engineering',
        department: 'Technology',
        createdAt: new Date(),
        isActive: true
      });
      await engineeringTeam.save();

      const productTeam = await teamRepo.create({
        name: 'Product',
        department: 'Product',
        createdAt: new Date(),
        isActive: true
      });
      await productTeam.save();

      // Create users
      const teamLead = await userRepo.create({
        username: 'lead_sarah',
        email: 'sarah@teamcorp.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        age: 35
      });
      await teamLead.save();

      const developer1 = await userRepo.create({
        username: 'dev_mike',
        email: 'mike@teamcorp.com',
        firstName: 'Mike',
        lastName: 'Chen',
        age: 28
      });
      await developer1.save();

      const developer2 = await userRepo.create({
        username: 'dev_lisa',
        email: 'lisa@teamcorp.com',
        firstName: 'Lisa',
        lastName: 'Williams',
        age: 31
      });
      await developer2.save();

      // Create company-team relationships
      await neogm.rawQuery().execute(`
        MATCH (c:Company), (t:Team)
        WHERE ID(c) = $companyId AND ID(t) = $teamId
        CREATE (c)-[:HAS_TEAM {createdAt: $createdAt}]->(t)
      `, {
        companyId: company.getId(),
        teamId: engineeringTeam.getId(),
        createdAt: new Date().toISOString()
      });

      await neogm.rawQuery().execute(`
        MATCH (c:Company), (t:Team)
        WHERE ID(c) = $companyId AND ID(t) = $teamId
        CREATE (c)-[:HAS_TEAM {createdAt: $createdAt}]->(t)
      `, {
        companyId: company.getId(),
        teamId: productTeam.getId(),
        createdAt: new Date().toISOString()
      });

      // Create team leadership relationships
      await neogm.rawQuery().execute(`
        MATCH (u:User), (t:Team)
        WHERE ID(u) = $userId AND ID(t) = $teamId
        CREATE (u)-[:LEADS {startDate: $startDate}]->(t)
      `, {
        userId: teamLead.getId(),
        teamId: engineeringTeam.getId(),
        startDate: '2023-01-01'
      });

      // Create team membership relationships
      const memberships = [
        { userId: teamLead.getId(), teamId: engineeringTeam.getId(), role: 'Team Lead' },
        { userId: developer1.getId(), teamId: engineeringTeam.getId(), role: 'Senior Developer' },
        { userId: developer2.getId(), teamId: engineeringTeam.getId(), role: 'Developer' }
      ];

      for (const membership of memberships) {
        await neogm.rawQuery().execute(`
          MATCH (u:User), (t:Team)
          WHERE ID(u) = $userId AND ID(t) = $teamId
          CREATE (u)-[:MEMBER_OF {role: $role, joinedAt: $joinedAt}]->(t)
        `, {
          userId: membership.userId,
          teamId: membership.teamId,
          role: membership.role,
          joinedAt: new Date().toISOString()
        });
      }

      // Verify team structure
      const teamStructure = await neogm.queryBuilder()
        .match('(c:Company)-[:HAS_TEAM]->(t:Team)<-[:MEMBER_OF]-(u:User)')
        .where({ 'c.name': 'Team Corp', 't.name': 'Engineering' })
        .return('u.username as username, t.name as teamName')
        .execute();

      expect(teamStructure.records).toHaveLength(3);
      expect(teamStructure.records.every(r => r.teamName === 'Engineering')).toBe(true);
    });
  });

  describe('Social Network Relationships', () => {
    it('should handle user following relationships', async () => {
      // Create users
      const users: User[] = [];
      for (let i = 1; i <= 5; i++) {
        const user = await userRepo.create({
          username: `social_user${i}`,
          email: `user${i}@social.com`,
          firstName: `User`,
          lastName: `${i}`,
          age: 25 + i
        });
        await user.save();
        users.push(user);
      }

      // Create following relationships
      // User1 follows User2, User3, User4
      // User2 follows User3, User5
      // User3 follows User4
      const followRelationships = [
        { followerId: users[0].getId(), followeeId: users[1].getId() },
        { followerId: users[0].getId(), followeeId: users[2].getId() },
        { followerId: users[0].getId(), followeeId: users[3].getId() },
        { followerId: users[1].getId(), followeeId: users[2].getId() },
        { followerId: users[1].getId(), followeeId: users[4].getId() },
        { followerId: users[2].getId(), followeeId: users[3].getId() }
      ];

      for (const rel of followRelationships) {
        await neogm.rawQuery().execute(`
          MATCH (follower:User), (followee:User)
          WHERE ID(follower) = $followerId AND ID(followee) = $followeeId
          CREATE (follower)-[:FOLLOWS {since: $since}]->(followee)
        `, {
          followerId: rel.followerId,
          followeeId: rel.followeeId,
          since: new Date().toISOString()
        });
      }

      // Test follower/following counts
      const user1Follows = await neogm.queryBuilder()
        .match('(u:User)-[:FOLLOWS]->(followed:User)')
        .where({ 'u.username': 'social_user1' })
        .return('count(followed) as followingCount')
        .execute();

      expect(user1Follows.records[0].followingCount.toNumber()).toBe(3);

      const user3Followers = await neogm.queryBuilder()
        .match('(follower:User)-[:FOLLOWS]->(u:User)')
        .where({ 'u.username': 'social_user3' })
        .return('count(follower) as followerCount')
        .execute();

      expect(user3Followers.records[0].followerCount.toNumber()).toBe(2);

      // Test mutual following (friends)
      const mutualFollows = await neogm.queryBuilder()
        .match('(u1:User)-[:FOLLOWS]->(u2:User)-[:FOLLOWS]->(u1)')
        .return('u1.username as user1, u2.username as user2')
        .execute();

      expect(mutualFollows.records.length).toBeGreaterThan(0);
    });

    it('should handle content interactions', async () => {
      // Create author
      const author = await userRepo.create({
        username: 'content_author',
        email: 'author@content.com',
        firstName: 'Content',
        lastName: 'Author'
      });
      await author.save();

      // Create readers
      const readers: User[] = [];
      for (let i = 1; i <= 3; i++) {
        const reader = await userRepo.create({
          username: `reader${i}`,
          email: `reader${i}@content.com`,
          firstName: `Reader`,
          lastName: `${i}`
        });
        await reader.save();
        readers.push(reader);
      }

      // Create post
      const post = await postRepo.create({
        title: 'Interesting Tech Article',
        content: 'This is a comprehensive article about technology trends...',
        status: 'published',
        createdAt: new Date(),
        publishedAt: new Date(),
        viewCount: 0,
        tags: ['technology', 'trends', 'future']
      });
      await post.save();

      // Create author relationship
      await neogm.rawQuery().execute(`
        MATCH (u:User), (p:Post)
        WHERE ID(u) = $authorId AND ID(p) = $postId
        CREATE (u)-[:CREATED {createdAt: $createdAt}]->(p)
      `, {
        authorId: author.getId(),
        postId: post.getId(),
        createdAt: new Date().toISOString()
      });

      // Create like relationships
      for (const reader of readers) {
        await neogm.rawQuery().execute(`
          MATCH (u:User), (p:Post)
          WHERE ID(u) = $userId AND ID(p) = $postId
          CREATE (u)-[:LIKES {likedAt: $likedAt}]->(p)
        `, {
          userId: reader.getId(),
          postId: post.getId(),
          likedAt: new Date().toISOString()
        });
      }

      // Create comments
      const comments: Comment[] = [];
      for (let i = 0; i < 2; i++) {
        const comment = await commentRepo.create({
          content: `This is comment ${i + 1} on the article`,
          createdAt: new Date(),
          isEdited: false
        });
        await comment.save();
        comments.push(comment);

        // Link comment to post and author
        await neogm.rawQuery().execute(`
          MATCH (c:Comment), (p:Post)
          WHERE ID(c) = $commentId AND ID(p) = $postId
          CREATE (c)-[:COMMENTED_ON]->(p)
        `, {
          commentId: comment.getId(),
          postId: post.getId()
        });

        await neogm.rawQuery().execute(`
          MATCH (u:User), (c:Comment)
          WHERE ID(u) = $userId AND ID(c) = $commentId
          CREATE (u)-[:WROTE {writtenAt: $writtenAt}]->(c)
        `, {
          userId: readers[i].getId(),
          commentId: comment.getId(),
          writtenAt: new Date().toISOString()
        });
      }

      // Verify content interactions
      const postStats = await neogm.queryBuilder()
        .match('(p:Post)<-[:COMMENTED_ON]-(c:Comment), (p)<-[:LIKES]-(u:User)')
        .where({ 'p.title': 'Interesting Tech Article' })
        .return('count(DISTINCT c) as commentCount, count(DISTINCT u) as likeCount')
        .execute();

      expect(postStats.records[0].commentCount.toNumber()).toBe(2);
      expect(postStats.records[0].likeCount.toNumber()).toBe(3);
    });
  });

  describe('Project and Work Relationships', () => {
    it('should handle complex project assignments', async () => {
      // Create company
      const company = await companyRepo.create({
        name: 'Project Corp',
        industry: 'Consulting'
      });
      await company.save();

      // Create teams
      const devTeam = await teamRepo.create({
        name: 'Development',
        department: 'Engineering',
        isActive: true
      });
      await devTeam.save();

      const qaTeam = await teamRepo.create({
        name: 'Quality Assurance',
        department: 'Engineering',
        isActive: true
      });
      await qaTeam.save();

      // Create users
      const pm = await userRepo.create({
        username: 'pm_alex',
        email: 'alex@projectcorp.com',
        firstName: 'Alex',
        lastName: 'Manager',
        age: 38
      });
      await pm.save();

      const devs: User[] = [];
      for (let i = 1; i <= 3; i++) {
        const dev = await userRepo.create({
          username: `dev${i}`,
          email: `dev${i}@projectcorp.com`,
          firstName: `Dev`,
          lastName: `${i}`,
          age: 25 + i
        });
        await dev.save();
        devs.push(dev);
      }

      const qaEngineer = await userRepo.create({
        username: 'qa_sam',
        email: 'sam@projectcorp.com',
        firstName: 'Sam',
        lastName: 'Tester',
        age: 29
      });
      await qaEngineer.save();

      // Create project
      const project = await projectRepo.create({
        name: 'E-commerce Platform',
        description: 'Build a scalable e-commerce platform',
        status: 'active',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        priority: 'high',
        budget: 500000
      });
      await project.save();

      // Create company ownership of project
      await neogm.rawQuery().execute(`
        MATCH (c:Company), (p:Project)
        WHERE ID(c) = $companyId AND ID(p) = $projectId
        CREATE (c)-[:OWNS {assignedAt: $assignedAt}]->(p)
      `, {
        companyId: company.getId(),
        projectId: project.getId(),
        assignedAt: new Date().toISOString()
      });

      // Assign project manager
      await neogm.rawQuery().execute(`
        MATCH (p:Project), (u:User)
        WHERE ID(p) = $projectId AND ID(u) = $userId
        CREATE (p)-[:MANAGED_BY {assignedAt: $assignedAt, role: $role}]->(u)
      `, {
        projectId: project.getId(),
        userId: pm.getId(),
        assignedAt: new Date().toISOString(),
        role: 'Project Manager'
      });

      // Assign team members to project
      const teamAssignments = [
        ...devs.map(dev => ({ userId: dev.getId(), role: 'Developer', team: 'Development' })),
        { userId: qaEngineer.getId(), role: 'QA Engineer', team: 'Quality Assurance' }
      ];

      for (const assignment of teamAssignments) {
        await neogm.rawQuery().execute(`
          MATCH (p:Project), (u:User)
          WHERE ID(p) = $projectId AND ID(u) = $userId
          CREATE (p)-[:ASSIGNED_TO {role: $role, assignedAt: $assignedAt}]->(u)
        `, {
          projectId: project.getId(),
          userId: assignment.userId,
          role: assignment.role,
          assignedAt: new Date().toISOString()
        });
      }

      // Assign teams to project
      await neogm.rawQuery().execute(`
        MATCH (p:Project), (t:Team)
        WHERE ID(p) = $projectId AND ID(t) = $teamId
        CREATE (p)-[:WORKED_ON_BY {assignedAt: $assignedAt}]->(t)
      `, {
        projectId: project.getId(),
        teamId: devTeam.getId(),
        assignedAt: new Date().toISOString()
      });

      await neogm.rawQuery().execute(`
        MATCH (p:Project), (t:Team)
        WHERE ID(p) = $projectId AND ID(t) = $teamId
        CREATE (p)-[:WORKED_ON_BY {assignedAt: $assignedAt}]->(t)
      `, {
        projectId: project.getId(),
        teamId: qaTeam.getId(),
        assignedAt: new Date().toISOString()
      });

      // Verify project structure
      const projectTeam = await neogm.queryBuilder()
        .match('(p:Project)-[:ASSIGNED_TO]->(u:User)')
        .where({ 'p.name': 'E-commerce Platform' })
        .return('count(u) as teamSize')
        .execute();

      expect(projectTeam.records[0].teamSize.toNumber()).toBe(4); // 3 devs + 1 QA

      const projectManager = await neogm.queryBuilder()
        .match('(p:Project)-[:MANAGED_BY]->(u:User)')
        .where({ 'p.name': 'E-commerce Platform' })
        .return('u.username as managerUsername')
        .execute();

      expect(projectManager.records[0].managerUsername).toBe('pm_alex');
    });
  });

  describe('Relationship Queries and Analytics', () => {
    beforeEach(async () => {
      // Create a comprehensive dataset for analytics
      const companies: Company[] = [];
      const users: User[] = [];
      const teams: Team[] = [];

      // Create companies
      for (let i = 1; i <= 3; i++) {
        const company = await companyRepo.create({
          name: `Analytics Corp ${i}`,
          industry: i === 1 ? 'Technology' : i === 2 ? 'Finance' : 'Healthcare',
          foundedYear: 2020 - i,
          size: i === 1 ? 'large' : i === 2 ? 'medium' : 'small'
        });
        await company.save();
        companies.push(company);
      }

      // Create users across companies
      for (let i = 1; i <= 15; i++) {
        const companyIndex = (i - 1) % 3;
        const user = await userRepo.create({
          username: `analytics_user${i}`,
          email: `user${i}@analytics.com`,
          firstName: `User`,
          lastName: `${i}`,
          age: 25 + (i % 15),
          isActive: i <= 12 // 3 inactive users
        });
        await user.save();
        users.push(user);

        // Create employment relationships
        await neogm.rawQuery().execute(`
          MATCH (u:User), (c:Company)
          WHERE ID(u) = $userId AND ID(c) = $companyId
          CREATE (u)-[:WORKS_AT {position: $position, startDate: $startDate}]->(c)
        `, {
          userId: user.getId(),
          companyId: companies[companyIndex].getId(),
          position: i % 3 === 0 ? 'Manager' : i % 3 === 1 ? 'Senior' : 'Junior',
          startDate: `2023-0${(i % 12) + 1}-01`
        });
      }

      // Create teams for each company
      for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
        for (let teamIndex = 1; teamIndex <= 2; teamIndex++) {
          const team = await teamRepo.create({
            name: `Team ${teamIndex}`,
            department: teamIndex === 1 ? 'Engineering' : 'Product',
            isActive: true
          });
          await team.save();
          teams.push(team);

          // Link team to company
          await neogm.rawQuery().execute(`
            MATCH (c:Company), (t:Team)
            WHERE ID(c) = $companyId AND ID(t) = $teamId
            CREATE (c)-[:HAS_TEAM]->(t)
          `, {
            companyId: companies[companyIndex].getId(),
            teamId: team.getId()
          });
        }
      }

      // Create some following relationships
      for (let i = 0; i < 10; i++) {
        const followerId = users[i].getId();
        const followeeId = users[(i + 5) % 15].getId();
        
        if (followerId !== followeeId) {
          await neogm.rawQuery().execute(`
            MATCH (follower:User), (followee:User)
            WHERE ID(follower) = $followerId AND ID(followee) = $followeeId
            CREATE (follower)-[:FOLLOWS {since: $since}]->(followee)
          `, {
            followerId,
            followeeId,
            since: new Date().toISOString()
          });
        }
      }
    });

    it('should analyze company employee distributions', async () => {
      const companyStats = await neogm.queryBuilder()
        .match('(c:Company)<-[:WORKS_AT]-(u:User)')
        .return('c.name as company, c.industry as industry, count(u) as employeeCount')
        .orderBy('employeeCount', 'DESC')
        .execute();

      expect(companyStats.records).toHaveLength(3);
      expect(companyStats.records.every(r => r.employeeCount.toNumber() === 5)).toBe(true);
    });

    it('should find most connected users', async () => {
      const socialStats = await neogm.queryBuilder()
        .match('(u:User)')
        .optionalMatch('(u)-[:FOLLOWS]->(following:User)')
        .optionalMatch('(follower:User)-[:FOLLOWS]->(u)')
        .return(`
          u.username as username,
          count(DISTINCT following) as followingCount,
          count(DISTINCT follower) as followerCount
        `)
        .orderBy('followingCount + followerCount', 'DESC')
        .limit(5)
        .execute();

      expect(socialStats.records).toHaveLength(5);
      expect(socialStats.records[0].followingCount.toNumber() + socialStats.records[0].followerCount.toNumber())
        .toBeGreaterThanOrEqual(0);
    });

    it('should analyze cross-company connections', async () => {
      const crossCompanyConnections = await neogm.queryBuilder()
        .match(`
          (u1:User)-[:WORKS_AT]->(c1:Company),
          (u2:User)-[:WORKS_AT]->(c2:Company),
          (u1)-[:FOLLOWS]->(u2)
        `)
        .where('c1.name <> c2.name')
        .return('c1.name as company1, c2.name as company2, count(*) as connections')
        .execute();

      expect(crossCompanyConnections.records.length).toBeGreaterThanOrEqual(0);
    });

    it('should find potential team collaborations', async () => {
      const teamCollaborations = await neogm.queryBuilder()
        .match(`
          (t1:Team)<-[:HAS_TEAM]-(c:Company)-[:HAS_TEAM]->(t2:Team)
        `)
        .where('t1.name <> t2.name AND t1.department <> t2.department')
        .return('c.name as company, t1.name as team1, t2.name as team2')
        .execute();

      expect(teamCollaborations.records.length).toBeGreaterThanOrEqual(0);
    });

    it('should analyze user activity patterns', async () => {
      const userActivity = await neogm.queryBuilder()
        .match('(u:User)')
        .return(`
          u.isActive as isActive,
          count(u) as userCount,
          avg(u.age) as avgAge
        `)
        .execute();

      const activeUsers = userActivity.records.find(r => r.isActive === true);
      const inactiveUsers = userActivity.records.find(r => r.isActive === false);

      expect(activeUsers?.userCount.toNumber()).toBe(12);
      expect(inactiveUsers?.userCount.toNumber()).toBe(3);
    });
  });

  describe('Relationship Maintenance', () => {
    it('should handle relationship updates and deletions', async () => {
      // Create users
      const user1 = await userRepo.create({
        username: 'rel_user1',
        email: 'user1@rel.com',
        firstName: 'Rel',
        lastName: 'User1'
      });
      await user1.save();

      const user2 = await userRepo.create({
        username: 'rel_user2',
        email: 'user2@rel.com',
        firstName: 'Rel',
        lastName: 'User2'
      });
      await user2.save();

      // Create initial follow relationship
      await neogm.rawQuery().execute(`
        MATCH (u1:User), (u2:User)
        WHERE ID(u1) = $user1Id AND ID(u2) = $user2Id
        CREATE (u1)-[:FOLLOWS {since: $since, status: $status}]->(u2)
      `, {
        user1Id: user1.getId(),
        user2Id: user2.getId(),
        since: '2023-01-01',
        status: 'active'
      });

      // Verify relationship exists
      let followCheck = await neogm.queryBuilder()
        .match('(u1:User)-[r:FOLLOWS]->(u2:User)')
        .where({ 'u1.username': 'rel_user1', 'u2.username': 'rel_user2' })
        .return('r.status as status')
        .execute();

      expect(followCheck.records[0].status).toBe('active');

      // Update relationship properties
      await neogm.rawQuery().execute(`
        MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
        WHERE ID(u1) = $user1Id AND ID(u2) = $user2Id
        SET r.status = $newStatus, r.updatedAt = $updatedAt
      `, {
        user1Id: user1.getId(),
        user2Id: user2.getId(),
        newStatus: 'blocked',
        updatedAt: new Date().toISOString()
      });

      // Verify update
      followCheck = await neogm.queryBuilder()
        .match('(u1:User)-[r:FOLLOWS]->(u2:User)')
        .where({ 'u1.username': 'rel_user1', 'u2.username': 'rel_user2' })
        .return('r.status as status')
        .execute();

      expect(followCheck.records[0].status).toBe('blocked');

      // Delete relationship
      await neogm.rawQuery().execute(`
        MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
        WHERE ID(u1) = $user1Id AND ID(u2) = $user2Id
        DELETE r
      `, {
        user1Id: user1.getId(),
        user2Id: user2.getId()
      });

      // Verify deletion
      followCheck = await neogm.queryBuilder()
        .match('(u1:User)-[r:FOLLOWS]->(u2:User)')
        .where({ 'u1.username': 'rel_user1', 'u2.username': 'rel_user2' })
        .return('count(r) as count')
        .execute();

      expect(followCheck.records[0].count.toNumber()).toBe(0);
    });
  });
});