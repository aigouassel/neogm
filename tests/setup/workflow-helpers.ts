import { NeoGM } from '../../src/lib/neogm';
import { User, Company, Team, Post, Comment, Project } from '../models/test-entities';

export interface WorkflowData {
  company: Company;
  teams: {
    engineering: Team;
    product: Team;
  };
  users: {
    cto: User;
    productManager: User;
    engineer1: User;
    engineer2: User;
    qaEngineer: User;
  };
  projects: {
    mobileApp: Project;
  };
  posts: Post[];
  comments: Comment[];
}

export class WorkflowTestHelpers {
  constructor(private neogm: NeoGM) {}

  /**
   * Creates a complete tech company scenario with realistic data
   */
  async createCompanyFoundation(): Promise<WorkflowData> {
    const userRepo = this.neogm.getRepository(User);
    const companyRepo = this.neogm.getRepository(Company);
    const teamRepo = this.neogm.getRepository(Team);
    const postRepo = this.neogm.getRepository(Post);
    const commentRepo = this.neogm.getRepository(Comment);
    const projectRepo = this.neogm.getRepository(Project);

    // === PHASE 1: Company Foundation ===
    
    // Create the company
    const company = await companyRepo.create({
      name: 'TechCorp Innovation Labs',
      description: 'A cutting-edge technology company building the future',
      website: 'https://techcorp.com',
      foundedYear: 2020,
      industry: 'Technology',
      size: 'medium',
      headquarters: { city: 'San Francisco', country: 'USA' },
      isPublic: false
    });
    await company.save();

    // Create organizational teams
    const engineeringTeam = await teamRepo.create({
      name: 'Engineering',
      description: 'Software development and architecture team',
      department: 'Technology',
      createdAt: new Date(),
      isActive: true
    });
    await engineeringTeam.save();

    const productTeam = await teamRepo.create({
      name: 'Product',
      description: 'Product strategy and user experience team',
      department: 'Product',
      createdAt: new Date(),
      isActive: true
    });
    await productTeam.save();

    // Link teams to company
    await this.neogm.rawQuery().execute(`
      MATCH (c:Company), (t:Team)
      WHERE ID(c) = $companyId AND ID(t) = $teamId
      CREATE (c)-[:HAS_TEAM {establishedAt: $establishedAt}]->(t)
    `, {
      companyId: company.getId(),
      teamId: engineeringTeam.getId(),
      establishedAt: new Date().toISOString()
    });

    await this.neogm.rawQuery().execute(`
      MATCH (c:Company), (t:Team)
      WHERE ID(c) = $companyId AND ID(t) = $teamId
      CREATE (c)-[:HAS_TEAM {establishedAt: $establishedAt}]->(t)
    `, {
      companyId: company.getId(),
      teamId: productTeam.getId(),
      establishedAt: new Date().toISOString()
    });

    // === PHASE 2: Team Building ===
    
    // Create leadership team
    const cto = await userRepo.create({
      username: 'cto_sarah',
      email: 'sarah@techcorp.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      age: 35,
      bio: 'Experienced technology leader with 15+ years in software architecture',
      createdAt: new Date(),
      isActive: true,
      tags: ['leadership', 'architecture', 'strategy']
    });
    await cto.save();

    const productManager = await userRepo.create({
      username: 'pm_alex',
      email: 'alex@techcorp.com',
      firstName: 'Alex',
      lastName: 'Rodriguez',
      age: 30,
      bio: 'Product strategist focused on user experience and market fit',
      createdAt: new Date(),
      isActive: true,
      tags: ['product', 'strategy', 'ux']
    });
    await productManager.save();

    // Create engineering team
    const engineer1 = await userRepo.create({
      username: 'dev_mike',
      email: 'mike@techcorp.com',
      firstName: 'Mike',
      lastName: 'Chen',
      age: 28,
      bio: 'Full-stack developer specializing in React and Node.js',
      createdAt: new Date(),
      isActive: true,
      tags: ['javascript', 'react', 'nodejs']
    });
    await engineer1.save();

    const engineer2 = await userRepo.create({
      username: 'dev_emily',
      email: 'emily@techcorp.com',
      firstName: 'Emily',
      lastName: 'Davis',
      age: 26,
      bio: 'Backend developer with expertise in Python and databases',
      createdAt: new Date(),
      isActive: true,
      tags: ['python', 'databases', 'api']
    });
    await engineer2.save();

    const qaEngineer = await userRepo.create({
      username: 'qa_david',
      email: 'david@techcorp.com',
      firstName: 'David',
      lastName: 'Wilson',
      age: 29,
      bio: 'Quality assurance engineer ensuring product reliability',
      createdAt: new Date(),
      isActive: true,
      tags: ['testing', 'automation', 'quality']
    });
    await qaEngineer.save();

    // Create employment relationships
    const users = [cto, productManager, engineer1, engineer2, qaEngineer];
    for (const user of users) {
      await this.neogm.rawQuery().execute(`
        MATCH (u:User), (c:Company)
        WHERE ID(u) = $userId AND ID(c) = $companyId
        CREATE (u)-[:WORKS_AT {
          position: $position,
          startDate: $startDate,
          salary: $salary,
          department: $department
        }]->(c)
      `, {
        userId: user.getId(),
        companyId: company.getId(),
        position: this.getUserPosition(user.username!),
        startDate: '2021-01-15',
        salary: this.getUserSalary(user.username!),
        department: this.getUserDepartment(user.username!)
      });
    }

    // Create team memberships
    const teamMemberships = [
      { user: cto, team: engineeringTeam, role: 'CTO' },
      { user: engineer1, team: engineeringTeam, role: 'Senior Developer' },
      { user: engineer2, team: engineeringTeam, role: 'Backend Developer' },
      { user: qaEngineer, team: engineeringTeam, role: 'QA Engineer' },
      { user: productManager, team: productTeam, role: 'Product Manager' }
    ];

    for (const membership of teamMemberships) {
      await this.neogm.rawQuery().execute(`
        MATCH (u:User), (t:Team)
        WHERE ID(u) = $userId AND ID(t) = $teamId
        CREATE (u)-[:MEMBER_OF {
          role: $role,
          joinedAt: $joinedAt,
          isActive: true
        }]->(t)
      `, {
        userId: membership.user.getId(),
        teamId: membership.team.getId(),
        role: membership.role,
        joinedAt: new Date().toISOString()
      });
    }

    // === PHASE 3: Social Network ===
    
    // Create following relationships (social network)
    const followRelationships = [
      { follower: engineer1, followee: cto },
      { follower: engineer2, followee: cto },
      { follower: qaEngineer, followee: cto },
      { follower: engineer1, followee: engineer2 },
      { follower: productManager, followee: cto },
      { follower: engineer2, followee: productManager }
    ];

    for (const rel of followRelationships) {
      await this.neogm.rawQuery().execute(`
        MATCH (follower:User), (followee:User)
        WHERE ID(follower) = $followerId AND ID(followee) = $followeeId
        CREATE (follower)-[:FOLLOWS {
          since: $since,
          notificationsEnabled: true
        }]->(followee)
      `, {
        followerId: rel.follower.getId(),
        followeeId: rel.followee.getId(),
        since: new Date().toISOString()
      });
    }

    // === PHASE 4: Project Launch ===
    
    // Create major project
    const mobileApp = await projectRepo.create({
      name: 'Mobile Platform Initiative',
      description: 'Next-generation mobile application platform',
      status: 'active',
      startDate: new Date('2023-01-01'),
      priority: 'high',
      budget: 750000
    });
    await mobileApp.save();

    // Link project to company
    await this.neogm.rawQuery().execute(`
      MATCH (p:Project), (c:Company)
      WHERE ID(p) = $projectId AND ID(c) = $companyId
      CREATE (c)-[:OWNS {
        startDate: $startDate,
        budget: $budget
      }]->(p)
    `, {
      projectId: mobileApp.getId(),
      companyId: company.getId(),
      startDate: '2023-01-01',
      budget: 750000
    });

    // Assign team members to project
    const projectAssignments = [
      { user: engineer1, role: 'Lead Developer', allocation: 80 },
      { user: engineer2, role: 'Backend Developer', allocation: 90 },
      { user: qaEngineer, role: 'QA Lead', allocation: 70 },
      { user: cto, role: 'Technical Advisor', allocation: 20 }
    ];

    for (const assignment of projectAssignments) {
      await this.neogm.rawQuery().execute(`
        MATCH (p:Project), (u:User)
        WHERE ID(p) = $projectId AND ID(u) = $userId
        CREATE (p)-[:ASSIGNED_TO {
          role: $role,
          timeAllocation: $allocation,
          assignedAt: $assignedAt
        }]->(u)
      `, {
        projectId: mobileApp.getId(),
        userId: assignment.user.getId(),
        role: assignment.role,
        allocation: assignment.allocation,
        assignedAt: new Date().toISOString()
      });
    }

    // Set project manager
    await this.neogm.rawQuery().execute(`
      MATCH (p:Project), (u:User)
      WHERE ID(p) = $projectId AND ID(u) = $userId
      CREATE (p)-[:MANAGED_BY {
        since: $since,
        responsibilities: ['planning', 'coordination', 'reporting']
      }]->(u)
    `, {
      projectId: mobileApp.getId(),
      userId: cto.getId(),
      since: new Date().toISOString()
    });

    // === PHASE 5: Knowledge Sharing ===
    
    // Create blog posts for knowledge sharing
    const posts = [];
    const postData = [
      {
        author: cto,
        title: 'Scaling Engineering Teams: Lessons Learned',
        content: 'In this post, I share insights from scaling our engineering team from 2 to 20+ developers...',
        status: 'published' as const,
        tags: ['leadership', 'scaling', 'engineering']
      },
      {
        author: engineer1,
        title: 'Modern React Patterns for Large Applications',
        content: 'Best practices for organizing React applications at scale, including state management...',
        status: 'published' as const,
        tags: ['react', 'javascript', 'patterns']
      },
      {
        author: engineer2,
        title: 'Database Optimization Strategies',
        content: 'Performance optimization techniques for Neo4j and other graph databases...',
        status: 'published' as const,
        tags: ['database', 'performance', 'neo4j']
      }
    ];

    for (const postInfo of postData) {
      const post = await postRepo.create({
        title: postInfo.title,
        content: postInfo.content,
        status: postInfo.status,
        createdAt: new Date(),
        publishedAt: new Date(),
        viewCount: Math.floor(Math.random() * 1000) + 100,
        tags: postInfo.tags
      });
      await post.save();
      posts.push(post);

      // Link post to author
      await this.neogm.rawQuery().execute(`
        MATCH (p:Post), (u:User)
        WHERE ID(p) = $postId AND ID(u) = $userId
        CREATE (u)-[:CREATED {
          createdAt: $createdAt,
          category: 'blog'
        }]->(p)
      `, {
        postId: post.getId(),
        userId: postInfo.author.getId(),
        createdAt: new Date().toISOString()
      });
    }

    // Create likes for posts
    const likeRelationships = [
      { user: engineer1, post: posts[0] }, // Mike likes CTO's post
      { user: engineer2, post: posts[0] }, // Emily likes CTO's post
      { user: qaEngineer, post: posts[0] }, // David likes CTO's post
      { user: productManager, post: posts[0] }, // Alex likes CTO's post
      { user: cto, post: posts[1] }, // CTO likes Mike's post
      { user: engineer2, post: posts[1] }, // Emily likes Mike's post
      { user: cto, post: posts[2] }, // CTO likes Emily's post
      { user: engineer1, post: posts[2] } // Mike likes Emily's post
    ];

    for (const like of likeRelationships) {
      await this.neogm.rawQuery().execute(`
        MATCH (u:User), (p:Post)
        WHERE ID(u) = $userId AND ID(p) = $postId
        CREATE (u)-[:LIKES {
          likedAt: $likedAt
        }]->(p)
      `, {
        userId: like.user.getId(),
        postId: like.post.getId(),
        likedAt: new Date().toISOString()
      });
    }

    // Create comments
    const comments = [];
    const commentData = [
      { author: engineer1, post: posts[0], content: 'Great insights! This really helped our team structure.' },
      { author: engineer2, post: posts[0], content: 'The part about communication patterns was especially valuable.' },
      { author: cto, post: posts[1], content: 'Excellent technical deep-dive. Will share this with the team.' },
      { author: engineer1, post: posts[2], content: 'These optimization tips saved us hours of debugging!' }
    ];

    for (const commentInfo of commentData) {
      const comment = await commentRepo.create({
        content: commentInfo.content,
        createdAt: new Date(),
        isEdited: false
      });
      await comment.save();
      comments.push(comment);

      // Link comment to post and author
      await this.neogm.rawQuery().execute(`
        MATCH (c:Comment), (p:Post), (u:User)
        WHERE ID(c) = $commentId AND ID(p) = $postId AND ID(u) = $userId
        CREATE (c)-[:COMMENTED_ON]->(p),
               (u)-[:WROTE]->(c)
      `, {
        commentId: comment.getId(),
        postId: commentInfo.post.getId(),
        userId: commentInfo.author.getId()
      });
    }

    // Small delay to ensure all data is committed
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      company,
      teams: {
        engineering: engineeringTeam,
        product: productTeam
      },
      users: {
        cto,
        productManager,
        engineer1,
        engineer2,
        qaEngineer
      },
      projects: {
        mobileApp
      },
      posts,
      comments
    };
  }

  /**
   * Creates performance test data with multiple companies
   */
  async createPerformanceTestData() {
    const companyRepo = this.neogm.getRepository(Company);
    const userRepo = this.neogm.getRepository(User);
    const projectRepo = this.neogm.getRepository(Project);

    const companies = [];
    const users = [];
    const projects = [];

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
    for (let i = 1; i <= 25; i++) {
      const companyIndex = Math.floor((i - 1) / 5);
      const user = await userRepo.create({
        username: `perf_user_${i}`,
        email: `user${i}@performance.com`,
        firstName: `User`,
        lastName: `${i}`,
        age: 22 + (i % 15),
        isActive: true
      });
      await user.save();
      users.push(user);

      // Link to company
      await this.neogm.rawQuery().execute(`
        MATCH (u:User), (c:Company)
        WHERE ID(u) = $userId AND ID(c) = $companyId
        CREATE (u)-[:WORKS_AT {position: $position, startDate: $startDate}]->(c)
      `, {
        userId: user.getId(),
        companyId: companies[companyIndex].getId(),
        position: 'Employee',
        startDate: '2023-01-01'
      });
    }

    // Create 10 projects (2 per company)
    for (let i = 1; i <= 10; i++) {
      const companyIndex = Math.floor((i - 1) / 2);
      const project = await projectRepo.create({
        name: `Performance Project ${i}`,
        description: `Test project ${i} for performance evaluation`,
        status: 'active',
        startDate: new Date(),
        budget: 100000 + (i * 50000)
      });
      await project.save();
      projects.push(project);

      // Link to company
      await this.neogm.rawQuery().execute(`
        MATCH (p:Project), (c:Company)
        WHERE ID(p) = $projectId AND ID(c) = $companyId
        CREATE (c)-[:OWNS]->(p)
      `, {
        projectId: project.getId(),
        companyId: companies[companyIndex].getId()
      });
    }

    return { companies, users, projects };
  }

  private getUserPosition(username: string): string {
    const positions: Record<string, string> = {
      'cto_sarah': 'Chief Technology Officer',
      'pm_alex': 'Product Manager',
      'dev_mike': 'Senior Software Engineer',
      'dev_emily': 'Software Engineer',
      'qa_david': 'QA Engineer'
    };
    return positions[username] || 'Employee';
  }

  private getUserSalary(username: string): number {
    const salaries: Record<string, number> = {
      'cto_sarah': 180000,
      'pm_alex': 130000,
      'dev_mike': 120000,
      'dev_emily': 110000,
      'qa_david': 100000
    };
    return salaries[username] || 80000;
  }

  private getUserDepartment(username: string): string {
    if (username.startsWith('dev_') || username.startsWith('cto_') || username.startsWith('qa_')) {
      return 'Engineering';
    }
    if (username.startsWith('pm_')) {
      return 'Product';
    }
    return 'General';
  }
}