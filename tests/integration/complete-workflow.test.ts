import { NeoGM } from '../../src/lib/neogm';
import { Repository } from '../../src/lib/entity';
import { User, Company, Team, Post, Comment, Project } from '../models/test-entities';

describe('Complete Real-World Workflow Test', () => {
  let neogm: NeoGM;
  let userRepo: Repository<User>;
  let companyRepo: Repository<Company>;
  let teamRepo: Repository<Team>;
  let postRepo: Repository<Post>;
  let commentRepo: Repository<Comment>;
  let projectRepo: Repository<Project>;

  // Workflow state
  let techCorp: Company;
  let engineeringTeam: Team;
  let productTeam: Team;
  let cto: User;
  let seniorDev: User;
  let juniorDev: User;
  let productManager: User;
  let designer: User;
  let mobilePlatformProject: Project;

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

  describe('Complete Tech Company Simulation', () => {
    it('should simulate a complete tech company workflow from scratch', async () => {
      // === PHASE 1: Company Foundation ===
      console.log('🏢 Creating company foundation...');
      
      // Create the company
      techCorp = await companyRepo.create({
        name: 'TechCorp Innovation Labs',
        description: 'A cutting-edge technology company building the future',
        website: 'https://techcorp.com',
        foundedYear: 2020,
        industry: 'Technology',
        size: 'medium',
        headquarters: { city: 'San Francisco', country: 'USA' },
        isPublic: false
      });
      await techCorp.save();
      expect(techCorp.getId()).toBeDefined();

      // Create organizational teams
      engineeringTeam = await teamRepo.create({
        name: 'Engineering',
        description: 'Software development and architecture team',
        department: 'Technology',
        createdAt: new Date(),
        isActive: true
      });
      await engineeringTeam.save();

      productTeam = await teamRepo.create({
        name: 'Product',
        description: 'Product strategy and user experience team',
        department: 'Product',
        createdAt: new Date(),
        isActive: true
      });
      await productTeam.save();

      // Link teams to company
      await neogm.rawQuery().execute(`
        MATCH (c:Company), (t:Team)
        WHERE ID(c) = $companyId AND ID(t) = $teamId
        CREATE (c)-[:HAS_TEAM {establishedAt: $establishedAt}]->(t)
      `, {
        companyId: techCorp.getId(),
        teamId: engineeringTeam.getId(),
        establishedAt: new Date().toISOString()
      });

      await neogm.rawQuery().execute(`
        MATCH (c:Company), (t:Team)
        WHERE ID(c) = $companyId AND ID(t) = $teamId
        CREATE (c)-[:HAS_TEAM {establishedAt: $establishedAt}]->(t)
      `, {
        companyId: techCorp.getId(),
        teamId: productTeam.getId(),
        establishedAt: new Date().toISOString()
      });

      // === PHASE 2: Team Building ===
      console.log('👥 Building the team...');

      // Create leadership
      cto = await userRepo.create({
        username: 'cto_sarah',
        email: 'sarah.johnson@techcorp.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        age: 42,
        bio: 'CTO and co-founder with 15+ years in tech leadership',
        createdAt: new Date('2020-01-01'),
        isActive: true,
        tags: ['leadership', 'architecture', 'strategy', 'javascript', 'python', 'aws']
      });
      await cto.save();

      // Create engineering team members
      seniorDev = await userRepo.create({
        username: 'dev_mike',
        email: 'mike.chen@techcorp.com',
        firstName: 'Mike',
        lastName: 'Chen',
        age: 32,
        bio: 'Senior Full-Stack Engineer specializing in scalable web applications',
        createdAt: new Date('2021-03-15'),
        isActive: true,
        tags: ['react', 'node.js', 'typescript', 'docker', 'postgresql']
      });
      await seniorDev.save();

      juniorDev = await userRepo.create({
        username: 'dev_alex',
        email: 'alex.rodriguez@techcorp.com',
        firstName: 'Alex',
        lastName: 'Rodriguez',
        age: 26,
        bio: 'Junior Developer passionate about mobile and web technologies',
        createdAt: new Date('2022-08-01'),
        isActive: true,
        tags: ['react-native', 'flutter', 'javascript', 'firebase']
      });
      await juniorDev.save();

      // Create product team
      productManager = await userRepo.create({
        username: 'pm_lisa',
        email: 'lisa.williams@techcorp.com',
        firstName: 'Lisa',
        lastName: 'Williams',
        age: 35,
        bio: 'Senior Product Manager driving user-centric product development',
        createdAt: new Date('2021-06-01'),
        isActive: true,
        tags: ['product-strategy', 'user-research', 'analytics', 'agile']
      });
      await productManager.save();

      designer = await userRepo.create({
        username: 'design_emma',
        email: 'emma.taylor@techcorp.com',
        firstName: 'Emma',
        lastName: 'Taylor',
        age: 29,
        bio: 'UX/UI Designer focused on creating beautiful, accessible experiences',
        createdAt: new Date('2022-01-10'),
        isActive: true,
        tags: ['ux', 'ui', 'figma', 'accessibility', 'user-testing']
      });
      await designer.save();

      // Create employment relationships
      const employments = [
        { user: cto, position: 'Chief Technology Officer', team: engineeringTeam, startDate: '2020-01-01', isLead: true },
        { user: seniorDev, position: 'Senior Software Engineer', team: engineeringTeam, startDate: '2021-03-15', isLead: false },
        { user: juniorDev, position: 'Software Engineer', team: engineeringTeam, startDate: '2022-08-01', isLead: false },
        { user: productManager, position: 'Senior Product Manager', team: productTeam, startDate: '2021-06-01', isLead: true },
        { user: designer, position: 'UX/UI Designer', team: productTeam, startDate: '2022-01-10', isLead: false }
      ];

      for (const emp of employments) {
        // Company employment
        await neogm.rawQuery().execute(`
          MATCH (u:User), (c:Company)
          WHERE ID(u) = $userId AND ID(c) = $companyId
          CREATE (u)-[:WORKS_AT {
            position: $position,
            startDate: $startDate,
            salary: $salary,
            isFullTime: true
          }]->(c)
        `, {
          userId: emp.user.getId(),
          companyId: techCorp.getId(),
          position: emp.position,
          startDate: emp.startDate,
          salary: emp.position.includes('Chief') ? 180000 : emp.position.includes('Senior') ? 120000 : 85000
        });

        // Team membership
        await neogm.rawQuery().execute(`
          MATCH (u:User), (t:Team)
          WHERE ID(u) = $userId AND ID(t) = $teamId
          CREATE (u)-[:MEMBER_OF {
            role: $role,
            joinedAt: $joinedAt,
            isActive: true
          }]->(t)
        `, {
          userId: emp.user.getId(),
          teamId: emp.team.getId(),
          role: emp.position,
          joinedAt: emp.startDate
        });

        // Team leadership
        if (emp.isLead) {
          await neogm.rawQuery().execute(`
            MATCH (u:User), (t:Team)
            WHERE ID(u) = $userId AND ID(t) = $teamId
            CREATE (u)-[:LEADS {
              appointedAt: $appointedAt,
              responsibilities: $responsibilities
            }]->(t)
          `, {
            userId: emp.user.getId(),
            teamId: emp.team.getId(),
            appointedAt: emp.startDate,
            responsibilities: emp.user === cto ? 'Technical vision and engineering leadership' : 'Product strategy and roadmap planning'
          });
        }
      }

      // === PHASE 3: Social Network Development ===
      console.log('🤝 Building internal social network...');

      // Create following relationships (company culture building)
      const followRelationships = [
        { follower: seniorDev, followee: cto, reason: 'Technical mentorship' },
        { follower: juniorDev, followee: cto, reason: 'Career guidance' },
        { follower: juniorDev, followee: seniorDev, reason: 'Learning from experience' },
        { follower: designer, followee: productManager, reason: 'Product collaboration' },
        { follower: productManager, followee: cto, reason: 'Strategic alignment' },
        { follower: cto, followee: productManager, reason: 'Product insights' }
      ];

      for (const rel of followRelationships) {
        await neogm.rawQuery().execute(`
          MATCH (follower:User), (followee:User)
          WHERE ID(follower) = $followerId AND ID(followee) = $followeeId
          CREATE (follower)-[:FOLLOWS {
            since: $since,
            context: $context,
            relationship: 'colleague'
          }]->(followee)
        `, {
          followerId: rel.follower.getId(),
          followeeId: rel.followee.getId(),
          since: new Date().toISOString(),
          context: rel.reason
        });
      }

      // === PHASE 4: Project Initiation ===
      console.log('🚀 Launching major project...');

      mobilePlatformProject = await projectRepo.create({
        name: 'Mobile Platform Initiative',
        description: 'Build a comprehensive mobile platform to expand our market reach and improve user engagement',
        status: 'active',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-06-30'),
        priority: 'high',
        budget: 750000
      });
      await mobilePlatformProject.save();

      // Project ownership and management
      await neogm.rawQuery().execute(`
        MATCH (c:Company), (p:Project)
        WHERE ID(c) = $companyId AND ID(p) = $projectId
        CREATE (c)-[:OWNS {
          approvedAt: $approvedAt,
          approvedBy: 'Board of Directors',
          budgetAllocated: $budget
        }]->(p)
      `, {
        companyId: techCorp.getId(),
        projectId: mobilePlatformProject.getId(),
        approvedAt: new Date('2023-08-15').toISOString(),
        budget: 750000
      });

      await neogm.rawQuery().execute(`
        MATCH (p:Project), (u:User)
        WHERE ID(p) = $projectId AND ID(u) = $userId
        CREATE (p)-[:MANAGED_BY {
          assignedAt: $assignedAt,
          responsibility: 'Overall project coordination and delivery',
          reportingTo: 'CTO'
        }]->(u)
      `, {
        projectId: mobilePlatformProject.getId(),
        userId: productManager.getId(),
        assignedAt: new Date('2023-08-20').toISOString()
      });

      // Team and individual assignments
      const projectAssignments = [
        { user: cto, role: 'Technical Architect', allocation: 25 },
        { user: seniorDev, role: 'Lead Developer', allocation: 80 },
        { user: juniorDev, role: 'Mobile Developer', allocation: 100 },
        { user: designer, role: 'UX/UI Designer', allocation: 60 }
      ];

      for (const assignment of projectAssignments) {
        await neogm.rawQuery().execute(`
          MATCH (p:Project), (u:User)
          WHERE ID(p) = $projectId AND ID(u) = $userId
          CREATE (p)-[:ASSIGNED_TO {
            role: $role,
            assignedAt: $assignedAt,
            timeAllocation: $allocation,
            expectedDelivery: $expectedDelivery
          }]->(u)
        `, {
          projectId: mobilePlatformProject.getId(),
          userId: assignment.user.getId(),
          role: assignment.role,
          assignedAt: new Date('2023-09-01').toISOString(),
          allocation: assignment.allocation,
          expectedDelivery: '2024-06-30'
        });
      }

      // Team assignments
      await neogm.rawQuery().execute(`
        MATCH (p:Project), (t:Team)
        WHERE ID(p) = $projectId AND ID(t) = $teamId
        CREATE (p)-[:WORKED_ON_BY {
          assignedAt: $assignedAt,
          primaryFocus: $focus,
          expectedContribution: $contribution
        }]->(t)
      `, {
        projectId: mobilePlatformProject.getId(),
        teamId: engineeringTeam.getId(),
        assignedAt: new Date('2023-09-01').toISOString(),
        focus: 'Mobile app development and backend services',
        contribution: 'Technical implementation and architecture'
      });

      await neogm.rawQuery().execute(`
        MATCH (p:Project), (t:Team)
        WHERE ID(p) = $projectId AND ID(t) = $teamId
        CREATE (p)-[:WORKED_ON_BY {
          assignedAt: $assignedAt,
          primaryFocus: $focus,
          expectedContribution: $contribution
        }]->(t)
      `, {
        projectId: mobilePlatformProject.getId(),
        teamId: productTeam.getId(),
        assignedAt: new Date('2023-09-01').toISOString(),
        focus: 'User experience and product strategy',
        contribution: 'Product design and user research'
      });

      // === PHASE 5: Knowledge Sharing & Content Creation ===
      console.log('📝 Creating knowledge sharing content...');

      // Technical blog posts
      const techPost = await postRepo.create({
        title: 'Building Scalable Mobile Architecture: Lessons from Our Platform Initiative',
        content: `
          As we embark on our Mobile Platform Initiative, I wanted to share some key architectural decisions and patterns we're implementing...
          
          ## Key Technologies
          - React Native for cross-platform development
          - Node.js microservices architecture
          - PostgreSQL with Redis caching
          - AWS infrastructure with Kubernetes orchestration
          
          ## Architecture Principles
          1. **Microservices First**: Each major feature is a separate service
          2. **API-First Design**: All functionality exposed through well-documented APIs
          3. **Progressive Enhancement**: Web-first, mobile-optimized
          4. **Real-time Capabilities**: WebSocket integration for live features
          
          Looking forward to sharing more insights as we progress!
        `,
        slug: 'scalable-mobile-architecture-lessons',
        status: 'published',
        createdAt: new Date(),
        publishedAt: new Date(),
        viewCount: 0,
        tags: ['architecture', 'mobile', 'react-native', 'microservices', 'aws']
      });
      await techPost.save();

      await neogm.rawQuery().execute(`
        MATCH (u:User), (p:Post)
        WHERE ID(u) = $authorId AND ID(p) = $postId
        CREATE (u)-[:CREATED {
          createdAt: $createdAt,
          motivation: 'Share technical insights with the team'
        }]->(p)
      `, {
        authorId: cto.getId(),
        postId: techPost.getId(),
        createdAt: new Date().toISOString()
      });

      // Product strategy post
      const productPost = await postRepo.create({
        title: 'User-Centric Mobile Design: Research Insights and Design Decisions',
        content: `
          Our mobile platform initiative is driven by extensive user research and data-driven design decisions...
          
          ## Research Findings
          - 73% of our users primarily access our platform on mobile
          - Average session time on mobile is 40% longer than desktop
          - Push notifications increase engagement by 180%
          
          ## Design Principles
          1. **Mobile-First Thinking**: Every feature designed for mobile first
          2. **Accessibility by Default**: WCAG 2.1 AA compliance from day one
          3. **Performance Optimization**: Sub-3 second load times
          4. **Offline Capabilities**: Core features work without connectivity
          
          Excited to see how these insights shape our final product!
        `,
        slug: 'user-centric-mobile-design-insights',
        status: 'published',
        createdAt: new Date(),
        publishedAt: new Date(),
        viewCount: 0,
        tags: ['product', 'ux', 'mobile', 'user-research', 'accessibility']
      });
      await productPost.save();

      await neogm.rawQuery().execute(`
        MATCH (u:User), (p:Post)
        WHERE ID(u) = $authorId AND ID(p) = $postId
        CREATE (u)-[:CREATED {
          createdAt: $createdAt,
          motivation: 'Share product insights and user research'
        }]->(p)
      `, {
        authorId: productManager.getId(),
        postId: productPost.getId(),
        createdAt: new Date().toISOString()
      });

      // Team engagement through likes and comments
      const teamMembers = [cto, seniorDev, juniorDev, productManager, designer];
      const posts = [techPost, productPost];

      for (const post of posts) {
        // Everyone likes both posts (good team engagement!)
        for (const member of teamMembers) {
          if (member.getId() !== (post === techPost ? cto.getId() : productManager.getId())) {
            await neogm.rawQuery().execute(`
              MATCH (u:User), (p:Post)
              WHERE ID(u) = $userId AND ID(p) = $postId
              CREATE (u)-[:LIKES {
                likedAt: $likedAt,
                reaction: 'like'
              }]->(p)
            `, {
              userId: member.getId(),
              postId: post.getId(),
              likedAt: new Date().toISOString()
            });
          }
        }
      }

      // Create meaningful comments
      const comments = [
        {
          post: techPost,
          author: seniorDev,
          content: 'Great insights, Sarah! The microservices approach will definitely help us scale. I\'m particularly excited about the API-first design - it\'ll make integration testing much smoother.'
        },
        {
          post: techPost,
          author: juniorDev,
          content: 'This is super helpful for understanding the bigger picture. Would love to dive deeper into the WebSocket implementation when we get to that phase!'
        },
        {
          post: productPost,
          author: designer,
          content: 'The user research findings are fascinating! The 180% engagement increase from push notifications really validates our notification strategy. Can\'t wait to start prototyping!'
        },
        {
          post: productPost,
          author: seniorDev,
          content: 'The offline capabilities requirement is interesting from a technical perspective. We\'ll need to think carefully about data synchronization strategies.'
        }
      ];

      for (const commentData of comments) {
        const comment = await commentRepo.create({
          content: commentData.content,
          createdAt: new Date(),
          isEdited: false
        });
        await comment.save();

        // Link comment to post
        await neogm.rawQuery().execute(`
          MATCH (c:Comment), (p:Post)
          WHERE ID(c) = $commentId AND ID(p) = $postId
          CREATE (c)-[:COMMENTED_ON {commentedAt: $commentedAt}]->(p)
        `, {
          commentId: comment.getId(),
          postId: commentData.post.getId(),
          commentedAt: new Date().toISOString()
        });

        // Link comment to author
        await neogm.rawQuery().execute(`
          MATCH (u:User), (c:Comment)
          WHERE ID(u) = $userId AND ID(c) = $commentId
          CREATE (u)-[:WROTE {writtenAt: $writtenAt}]->(c)
        `, {
          userId: commentData.author.getId(),
          commentId: comment.getId(),
          writtenAt: new Date().toISOString()
        });
      }

      // === PHASE 6: Analytics and Verification ===
      console.log('📊 Running comprehensive analytics...');

      // Verify company structure
      const companyStructure = await neogm.queryBuilder()
        .match('(c:Company)-[:HAS_TEAM]->(t:Team)<-[:MEMBER_OF]-(u:User)')
        .where({ 'c.name': 'TechCorp Innovation Labs' })
        .return('c.name as company, t.name as team, count(u) as memberCount')
        .execute();

      expect(companyStructure.records).toHaveLength(2);
      expect(companyStructure.records.find(r => r.team === 'Engineering')?.memberCount.toNumber()).toBe(3);
      expect(companyStructure.records.find(r => r.team === 'Product')?.memberCount.toNumber()).toBe(2);

      // Verify project assignments
      const projectTeam = await neogm.queryBuilder()
        .match('(p:Project)-[:ASSIGNED_TO]->(u:User)')
        .where({ 'p.name': 'Mobile Platform Initiative' })
        .return('count(u) as assignedMembers')
        .execute();

      expect(projectTeam.records[0].assignedMembers.toNumber()).toBe(4);

      // Verify social engagement
      const socialMetrics = await neogm.queryBuilder()
        .match('(u:User)')
        .optionalMatch('(u)-[:FOLLOWS]->(following:User)')
        .optionalMatch('(follower:User)-[:FOLLOWS]->(u)')
        .return('u.username as user, count(DISTINCT following) as following, count(DISTINCT follower) as followers')
        .orderBy('following + followers', 'DESC')
        .execute();

      expect(socialMetrics.records.length).toBe(5);
      const ctoMetrics = socialMetrics.records.find(r => r.user === 'cto_sarah');
      expect(ctoMetrics?.followers.toNumber()).toBeGreaterThan(0);

      // Verify content engagement
      const contentMetrics = await neogm.queryBuilder()
        .match('(p:Post)<-[:COMMENTED_ON]-(c:Comment), (p)<-[:LIKES]-(u:User)')
        .return('p.title as title, count(DISTINCT c) as comments, count(DISTINCT u) as likes')
        .execute();

      expect(contentMetrics.records).toHaveLength(2);
      expect(contentMetrics.records.every(r => r.comments.toNumber() >= 2)).toBe(true);
      expect(contentMetrics.records.every(r => r.likes.toNumber() >= 4)).toBe(true);

      // Advanced analytics: Cross-team collaboration analysis
      const collaborationMetrics = await neogm.queryBuilder()
        .match(`
          (u1:User)-[:MEMBER_OF]->(t1:Team),
          (u2:User)-[:MEMBER_OF]->(t2:Team),
          (u1)-[:FOLLOWS]->(u2)
        `)
        .where('t1.name <> t2.name')
        .return('t1.name as team1, t2.name as team2, count(*) as crossTeamConnections')
        .execute();

      expect(collaborationMetrics.records.length).toBeGreaterThan(0);

      // Project budget utilization analysis
      const budgetAnalysis = await neogm.queryBuilder()
        .match('(c:Company)-[owns:OWNS]->(p:Project)-[:ASSIGNED_TO]->(u:User)')
        .where({ 'p.name': 'Mobile Platform Initiative' })
        .return('p.budget as totalBudget, count(u) as assignedTeamSize')
        .execute();

      expect(budgetAnalysis.records[0].totalBudget.toNumber()).toBe(750000);
      expect(budgetAnalysis.records[0].assignedTeamSize.toNumber()).toBe(4);

      console.log('✅ Complete workflow simulation successful!');
    });

    it('should handle complex queries across the entire company graph', async () => {
      // Skip this test for now as it depends on the previous test's data
      // TODO: Implement standalone test setup instead of depending on previous test

      // Complex analytical queries
      
      // 1. Find the most influential team members (high follower count + project involvement)
      const influentialMembers = await neogm.queryBuilder()
        .match(`
          (u:User),
          (follower:User)-[:FOLLOWS]->(u),
          (p:Project)-[:ASSIGNED_TO]->(u)
        `)
        .return(`
          u.username as username,
          u.firstName + ' ' + u.lastName as fullName,
          count(DISTINCT follower) as followerCount,
          count(DISTINCT p) as projectCount,
          (count(DISTINCT follower) + count(DISTINCT p)) as influenceScore
        `)
        .orderBy('influenceScore', 'DESC')
        .limit(3)
        .execute();

      expect(influentialMembers.records).toHaveLength(3);
      expect(influentialMembers.records[0].influenceScore.toNumber()).toBeGreaterThan(0);

      // 2. Identify potential knowledge sharing opportunities
      const knowledgeGaps = await neogm.queryBuilder()
        .match(`
          (expert:User)-[:MEMBER_OF]->(t1:Team),
          (learner:User)-[:MEMBER_OF]->(t2:Team)
        `)
        .where(`
          t1.name <> t2.name AND 
          NOT (learner)-[:FOLLOWS]->(expert) AND
          expert.username IN ['cto_sarah', 'dev_mike']
        `)
        .return(`
          expert.username as expertUsername,
          learner.username as learnerUsername,
          t1.name as expertTeam,
          t2.name as learnerTeam
        `)
        .execute();

      expect(knowledgeGaps.records.length).toBeGreaterThanOrEqual(0);

      // 3. Project resource allocation efficiency
      const resourceAllocation = await neogm.queryBuilder()
        .match(`
          (p:Project)-[assign:ASSIGNED_TO]->(u:User)-[:MEMBER_OF]->(t:Team)
        `)
        .return(`
          p.name as projectName,
          t.name as teamName,
          count(u) as membersAssigned,
          avg(assign.timeAllocation) as avgTimeAllocation
        `)
        .execute();

      expect(resourceAllocation.records).toHaveLength(2); // Engineering and Product teams

      // 4. Content engagement by team correlation
      const contentTeamEngagement = await neogm.queryBuilder()
        .match(`
          (author:User)-[:CREATED]->(post:Post)<-[:LIKES]-(liker:User),
          (author)-[:MEMBER_OF]->(authorTeam:Team),
          (liker)-[:MEMBER_OF]->(likerTeam:Team)
        `)
        .return(`
          authorTeam.name as authorTeam,
          likerTeam.name as likerTeam,
          count(*) as engagementCount,
          CASE WHEN authorTeam.name = likerTeam.name THEN 'same-team' ELSE 'cross-team' END as engagementType
        `)
        .execute();

      expect(contentTeamEngagement.records.length).toBeGreaterThan(0);

      // 5. Company growth trajectory analysis
      const companyGrowth = await neogm.queryBuilder()
        .match('(u:User)-[:WORKS_AT]->(c:Company)')
        .where({ 'c.name': 'TechCorp Innovation Labs' })
        .return(`
          c.foundedYear as foundedYear,
          count(u) as currentEmployees,
          avg(u.age) as avgAge,
          collect(DISTINCT u.tags) as allSkills
        `)
        .execute();

      expect(companyGrowth.records[0].currentEmployees.toNumber()).toBe(5);
      expect(companyGrowth.records[0].foundedYear.toNumber()).toBe(2020);
    });

    it('should demonstrate real-time operational queries', async () => {
      // Skip this test for now as it depends on the previous test's data
      // TODO: Implement standalone test setup instead of depending on previous test

      // Simulate real-time operational scenarios

      // 1. Daily standup report: Who's working on what?
      const standupReport = await neogm.queryBuilder()
        .match(`
          (u:User)-[:MEMBER_OF]->(t:Team),
          (p:Project)-[assign:ASSIGNED_TO]->(u)
        `)
        .return(`
          t.name as team,
          u.firstName + ' ' + u.lastName as memberName,
          assign.role as projectRole,
          p.name as projectName,
          assign.timeAllocation as allocation
        `)
        .orderBy('team, memberName')
        .execute();

      expect(standupReport.records.length).toBeGreaterThan(0);

      // 2. Project health check: Budget vs. team size vs. timeline
      const projectHealth = await neogm.queryBuilder()
        .match(`
          (c:Company)-[owns:OWNS]->(p:Project)-[:ASSIGNED_TO]->(u:User)
        `)
        .return(`
          p.name as projectName,
          p.status as status,
          p.priority as priority,
          p.budget as budget,
          count(u) as teamSize,
          (p.budget / count(u)) as budgetPerPerson
        `)
        .execute();

      expect(projectHealth.records[0].teamSize.toNumber()).toBe(4);
      expect(projectHealth.records[0].budgetPerPerson.toNumber()).toBe(187500); // 750000 / 4

      // 3. Team capacity analysis
      const teamCapacity = await neogm.queryBuilder()
        .match(`
          (t:Team)<-[:MEMBER_OF]-(u:User),
          (p:Project)-[assign:ASSIGNED_TO]->(u)
        `)
        .return(`
          t.name as teamName,
          count(DISTINCT u) as totalMembers,
          avg(assign.timeAllocation) as avgAllocation,
          sum(assign.timeAllocation) as totalAllocation
        `)
        .execute();

      expect(teamCapacity.records).toHaveLength(2);

      // 4. Knowledge network strength
      const knowledgeNetwork = await neogm.queryBuilder()
        .match(`
          (u1:User)-[:FOLLOWS]->(u2:User),
          (u1)-[:MEMBER_OF]->(t1:Team),
          (u2)-[:MEMBER_OF]->(t2:Team)
        `)
        .return(`
          CASE WHEN t1.name = t2.name THEN 'intra-team' ELSE 'inter-team' END as connectionType,
          count(*) as connectionCount
        `)
        .execute();

      expect(knowledgeNetwork.records.length).toBeGreaterThan(0);

      // 5. Content freshness and engagement velocity
      const contentVelocity = await neogm.queryBuilder()
        .match(`
          (author:User)-[:CREATED]->(post:Post),
          (post)<-[:LIKES]-(liker:User),
          (post)<-[:COMMENTED_ON]-(comment:Comment)
        `)
        .return(`
          post.title as title,
          author.username as authorUsername,
          count(DISTINCT liker) as totalLikes,
          count(DISTINCT comment) as totalComments,
          (count(DISTINCT liker) + count(DISTINCT comment)) as engagementScore
        `)
        .orderBy('engagementScore', 'DESC')
        .execute();

      expect(contentVelocity.records).toHaveLength(2);
      expect(contentVelocity.records.every(r => r.engagementScore.toNumber() > 0)).toBe(true);
    });
  });

  describe('Workflow Performance and Scalability', () => {
    it('should handle complex multi-entity operations efficiently', async () => {
      const startTime = Date.now();

      // Create a larger dataset to test performance
      const companies: Company[] = [];
      const users: User[] = [];
      const projects: Project[] = [];

      // Create 5 companies
      for (let i = 1; i <= 5; i++) {
        const company = await companyRepo.create({
          name: `Performance Corp ${i}`,
          industry: ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail'][i - 1],
          foundedYear: 2015 + i,
          size: (['startup', 'small', 'medium', 'large', 'enterprise'] as const)[i - 1]
        });
        await company.save();
        companies.push(company);
      }

      // Create 25 users (5 per company)
      for (let companyIndex = 0; companyIndex < 5; companyIndex++) {
        for (let userIndex = 1; userIndex <= 5; userIndex++) {
          const globalIndex = companyIndex * 5 + userIndex;
          const user = await userRepo.create({
            username: `perf_user_${globalIndex}`,
            email: `user${globalIndex}@perf${companyIndex + 1}.com`,
            firstName: `User`,
            lastName: `${globalIndex}`,
            age: 25 + (globalIndex % 20),
            createdAt: new Date(),
            isActive: true
          });
          await user.save();
          users.push(user);

          // Create employment relationship
          await neogm.rawQuery().execute(`
            MATCH (u:User), (c:Company)
            WHERE ID(u) = $userId AND ID(c) = $companyId
            CREATE (u)-[:WORKS_AT {position: $position, startDate: $startDate}]->(c)
          `, {
            userId: user.getId(),
            companyId: companies[companyIndex].getId(),
            position: userIndex === 1 ? 'Manager' : 'Employee',
            startDate: `2023-${String(companyIndex + 1).padStart(2, '0')}-01`
          });
        }
      }

      // Create 10 projects distributed across companies
      for (let i = 1; i <= 10; i++) {
        const companyIndex = (i - 1) % 5;
        const project = await projectRepo.create({
          name: `Performance Project ${i}`,
          description: `Test project ${i} for performance evaluation`,
          status: (['planning', 'active', 'completed'] as const)[i % 3],
          priority: (['low', 'medium', 'high', 'critical'] as const)[i % 4],
          budget: 50000 + (i * 10000)
        });
        await project.save();
        projects.push(project);

        // Assign project to company
        await neogm.rawQuery().execute(`
          MATCH (c:Company), (p:Project)
          WHERE ID(c) = $companyId AND ID(p) = $projectId
          CREATE (c)-[:OWNS]->(p)
        `, {
          companyId: companies[companyIndex].getId(),
          projectId: project.getId()
        });

        // Assign 2-3 users to each project
        const assignmentCount = 2 + (i % 2);
        for (let j = 0; j < assignmentCount; j++) {
          const userIndex = (companyIndex * 5) + j;
          await neogm.rawQuery().execute(`
            MATCH (p:Project), (u:User)
            WHERE ID(p) = $projectId AND ID(u) = $userId
            CREATE (p)-[:ASSIGNED_TO {role: $role, allocation: $allocation}]->(u)
          `, {
            projectId: project.getId(),
            userId: users[userIndex].getId(),
            role: j === 0 ? 'Lead' : 'Contributor',
            allocation: 50 + (j * 25)
          });
        }
      }

      const setupTime = Date.now() - startTime;

      // Run complex analytical queries
      const queryStartTime = Date.now();

      // Multi-dimensional analysis
      const results = await Promise.all([
        // Company performance analysis
        neogm.queryBuilder()
          .match('(c:Company)<-[:WORKS_AT]-(u:User), (c)-[:OWNS]->(p:Project)')
          .return('c.name as company, c.industry as industry, count(DISTINCT u) as employees, count(DISTINCT p) as projects')
          .execute(),

        // Cross-company project collaboration potential
        neogm.queryBuilder()
          .match('(c1:Company)-[:OWNS]->(p1:Project), (c2:Company)-[:OWNS]->(p2:Project)')
          .where('c1.industry = c2.industry AND c1.name <> c2.name')
          .return('c1.industry as industry, count(*) as collaborationOpportunities')
          .execute(),

        // Resource utilization analysis
        neogm.queryBuilder()
          .match('(u:User)<-[assign:ASSIGNED_TO]-(p:Project)')
          .return('u.username as user, count(p) as projectCount, avg(assign.allocation) as avgAllocation')
          .orderBy('projectCount', 'DESC')
          .limit(10)
          .execute(),

        // Industry distribution analysis
        neogm.queryBuilder()
          .match('(c:Company)<-[:WORKS_AT]-(u:User)')
          .return('c.industry as industry, count(u) as workforce, avg(u.age) as avgAge')
          .orderBy('workforce', 'DESC')
          .execute()
      ]);

      const queryTime = Date.now() - queryStartTime;
      const totalTime = Date.now() - startTime;

      // Performance assertions
      expect(setupTime).toBeLessThan(30000); // Setup should complete in under 30 seconds
      expect(queryTime).toBeLessThan(5000);  // Complex queries should complete in under 5 seconds
      expect(totalTime).toBeLessThan(35000); // Total workflow under 35 seconds

      // Data integrity assertions
      expect(companies).toHaveLength(5);
      expect(users).toHaveLength(25);
      expect(projects).toHaveLength(10);

      expect(results[0].records).toHaveLength(5); // All companies should have data
      expect(results[3].records).toHaveLength(5); // All industries should be represented

      console.log(`Performance metrics:
        - Setup time: ${setupTime}ms
        - Query time: ${queryTime}ms
        - Total time: ${totalTime}ms
        - Entities created: ${companies.length + users.length + projects.length}
        - Relationships created: ~${users.length + projects.length * 2.5}`);
    });
  });
});