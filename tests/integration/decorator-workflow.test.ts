import { NeoGM } from '../../src/lib/neogm';
import { Repository } from '../../src/lib/entity';
import { 
  User, 
  Company, 
  Team, 
  Post, 
  Comment, 
  Project 
} from '../models/test-entities';

describe('Decorator-based Full Workflow Integration Tests', () => {
  let neogm: NeoGM;
  let userRepo: Repository<User>;
  let companyRepo: Repository<Company>;
  let teamRepo: Repository<Team>;
  let postRepo: Repository<Post>;
  let commentRepo: Repository<Comment>;
  let projectRepo: Repository<Project>;

  // Test data containers
  let testUsers: User[] = [];
  let testCompanies: Company[] = [];
  let testTeams: Team[] = [];
  let testPosts: Post[] = [];

  beforeAll(async () => {
    neogm = new NeoGM({
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
      database: process.env.NEO4J_DATABASE || 'neo4j'
    });

    await neogm.connect();

    // Initialize repositories
    userRepo = neogm.getRepository(User);
    companyRepo = neogm.getRepository(Company);
    teamRepo = neogm.getRepository(Team);
    postRepo = neogm.getRepository(Post);
    commentRepo = neogm.getRepository(Comment);
    projectRepo = neogm.getRepository(Project);
  });

  beforeEach(async () => {
    await neogm.clearDatabase();
    testUsers = [];
    testCompanies = [];
    testTeams = [];
    testPosts = [];
  });

  afterAll(async () => {
    await neogm.disconnect();
  });

  describe('Entity Creation and Basic CRUD', () => {
    it('should create and save entities with all property types', async () => {
      // Create a company
      const company = await companyRepo.create({
        name: 'TechCorp Innovation',
        description: 'Leading technology company',
        website: 'https://techcorp.com',
        foundedYear: 2010,
        industry: 'Technology',
        size: 'medium',
        headquarters: { city: 'San Francisco', country: 'USA' },
        isPublic: true
      });
      await company.save();
      testCompanies.push(company);

      expect(company.getId()).toBeDefined();
      expect(company.name).toBe('TechCorp Innovation');
      expect(company.headquarters).toEqual({ city: 'San Francisco', country: 'USA' });

      // Create users
      const users = [
        {
          username: 'alice_dev',
          email: 'alice@techcorp.com',
          firstName: 'Alice',
          lastName: 'Johnson',
          age: 28,
          bio: 'Senior Software Engineer passionate about clean code',
          createdAt: new Date('2023-01-15'),
          isActive: true,
          tags: ['javascript', 'react', 'node.js']
        },
        {
          username: 'bob_pm',
          email: 'bob@techcorp.com',
          firstName: 'Bob',
          lastName: 'Smith',
          age: 35,
          bio: 'Product Manager with 10+ years experience',
          createdAt: new Date('2023-02-01'),
          isActive: true,
          tags: ['product-management', 'agile', 'strategy']
        },
        {
          username: 'carol_designer',
          email: 'carol@techcorp.com',
          firstName: 'Carol',
          lastName: 'Williams',
          age: 26,
          bio: 'UX/UI Designer focused on user-centered design',
          createdAt: new Date('2023-03-10'),
          isActive: true,
          tags: ['ux', 'ui', 'figma', 'prototyping']
        }
      ];

      for (const userData of users) {
        const user = await userRepo.create(userData);
        await user.save();
        testUsers.push(user);
      }

      expect(testUsers).toHaveLength(3);
      expect(testUsers[0].fullName).toBe('Alice Johnson');
      expect(testUsers[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle entity updates correctly', async () => {
      const user = await userRepo.create({
        username: 'updatable_user',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        isActive: true
      });
      await user.save();

      const originalId = user.getId();

      // Update properties
      user.age = 31;
      user.bio = 'Updated bio content';
      user.lastLoginAt = new Date();
      user.tags = ['updated', 'profile'];

      await user.save();

      // Verify the update
      expect(user.getId()).toBe(originalId);
      expect(user.age).toBe(31);
      expect(user.bio).toBe('Updated bio content');

      // Reload from database to verify persistence
      await user.reload();
      expect(user.age).toBe(31);
      expect(user.bio).toBe('Updated bio content');
      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });

    it('should handle entity deletion', async () => {
      const user = await userRepo.create({
        username: 'deletable_user',
        email: 'delete@example.com',
        firstName: 'Delete',
        lastName: 'Me'
      });
      await user.save();
      const userId = user.getId()!;

      // Delete the entity
      const deleted = await user.delete();
      expect(deleted).toBe(true);
      expect(user.getId()).toBeUndefined();

      // Verify it's gone from database
      const notFound = await userRepo.findById(userId);
      expect(notFound).toBeNull();
    });
  });

  describe('Repository Operations', () => {
    beforeEach(async () => {
      // Create test data
      const company = await companyRepo.create({
        name: 'Repository Test Corp',
        industry: 'Software'
      });
      await company.save();
      testCompanies.push(company);

      const userData = [
        { username: 'repo_user1', email: 'user1@repo.com', firstName: 'User', lastName: 'One', age: 25 },
        { username: 'repo_user2', email: 'user2@repo.com', firstName: 'User', lastName: 'Two', age: 30 },
        { username: 'repo_user3', email: 'user3@repo.com', firstName: 'User', lastName: 'Three', age: 35 },
      ];

      for (const data of userData) {
        const user = await userRepo.create(data);
        await user.save();
        testUsers.push(user);
      }
    });

    it('should find entities with various conditions', async () => {
      // Find all users
      const allUsers = await userRepo.find();
      expect(allUsers).toHaveLength(3);

      // Find with where condition
      const youngUsers = await userRepo.find({ where: { age: 25 } });
      expect(youngUsers).toHaveLength(1);
      expect(youngUsers[0].username).toBe('repo_user1');

      // Find with limit
      const limitedUsers = await userRepo.find({ limit: 2 });
      expect(limitedUsers).toHaveLength(2);

      // Find with skip
      const skippedUsers = await userRepo.find({ skip: 1, limit: 2 });
      expect(skippedUsers).toHaveLength(2);

      // Find with orderBy
      const orderedUsers = await userRepo.find({ orderBy: 'age' });
      expect(orderedUsers[0].age).toBe(25);
      expect(orderedUsers[2].age).toBe(35);
    });

    it('should find single entities', async () => {
      const user = await userRepo.findOne({ username: 'repo_user2' });
      expect(user).toBeTruthy();
      expect(user!.firstName).toBe('User');
      expect(user!.lastName).toBe('Two');

      const notFound = await userRepo.findOne({ username: 'nonexistent' });
      expect(notFound).toBeNull();
    });

    it('should count and check existence', async () => {
      const totalCount = await userRepo.count();
      expect(totalCount).toBe(3);

      const youngCount = await userRepo.count({ age: 25 });
      expect(youngCount).toBe(1);

      const exists = await userRepo.exists({ username: 'repo_user1' });
      expect(exists).toBe(true);

      const notExists = await userRepo.exists({ username: 'fake_user' });
      expect(notExists).toBe(false);
    });
  });

  describe('Property Validation and Transformation', () => {
    it('should validate required properties', async () => {
      const invalidUser = await userRepo.create({
        email: 'test@example.com',
        firstName: 'Test'
        // Missing required: username, lastName
      });

      await expect(invalidUser.save()).rejects.toThrow("Property 'username' is required");
    });

    it('should validate email format', async () => {
      const userWithInvalidEmail = await userRepo.create({
        username: 'test_user',
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User'
      });

      await expect(userWithInvalidEmail.save()).rejects.toThrow("Property 'email' failed validation");
    });

    it('should validate age range', async () => {
      const userWithInvalidAge = await userRepo.create({
        username: 'young_user',
        email: 'young@example.com',
        firstName: 'Too',
        lastName: 'Young',
        age: 10 // Below minimum age of 13
      });

      await expect(userWithInvalidAge.save()).rejects.toThrow("Property 'age' failed validation");
    });

    it('should transform dates correctly', async () => {
      const testDate = new Date('2023-06-15T10:30:00Z');
      const user = await userRepo.create({
        username: 'date_user',
        email: 'date@example.com',
        firstName: 'Date',
        lastName: 'User',
        createdAt: testDate
      });

      await user.save();

      // Reload and verify date transformation
      await user.reload();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt!.getTime()).toBe(testDate.getTime());
    });

    it('should transform complex objects', async () => {
      const headquarters = { city: 'New York', country: 'USA' };
      const company = await companyRepo.create({
        name: 'Transform Test Corp',
        headquarters
      });

      await company.save();
      await company.reload();

      expect(company.headquarters).toEqual(headquarters);
      expect(typeof company.headquarters).toBe('object');
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle a complete user onboarding workflow', async () => {
      // 1. Create company
      const company = await companyRepo.create({
        name: 'Onboarding Corp',
        description: 'A company for testing user onboarding',
        foundedYear: 2020,
        industry: 'Technology',
        size: 'startup'
      });
      await company.save();

      // 2. Create teams
      const engineeringTeam = await teamRepo.create({
        name: 'Engineering',
        description: 'Software development team',
        department: 'Technology',
        createdAt: new Date(),
        isActive: true
      });
      await engineeringTeam.save();

      const productTeam = await teamRepo.create({
        name: 'Product',
        description: 'Product management team',
        department: 'Product',
        createdAt: new Date(),
        isActive: true
      });
      await productTeam.save();

      // 3. Create users with different roles
      const cto = await userRepo.create({
        username: 'cto_sarah',
        email: 'sarah@onboarding.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        age: 38,
        bio: 'CTO and co-founder',
        createdAt: new Date(),
        isActive: true,
        tags: ['leadership', 'technology', 'strategy']
      });
      await cto.save();

      const engineer = await userRepo.create({
        username: 'dev_mike',
        email: 'mike@onboarding.com',
        firstName: 'Mike',
        lastName: 'Chen',
        age: 29,
        bio: 'Full-stack developer',
        createdAt: new Date(),
        isActive: true,
        tags: ['javascript', 'python', 'aws']
      });
      await engineer.save();

      const pm = await userRepo.create({
        username: 'pm_lisa',
        email: 'lisa@onboarding.com',
        firstName: 'Lisa',
        lastName: 'Williams',
        age: 32,
        bio: 'Senior Product Manager',
        createdAt: new Date(),
        isActive: true,
        tags: ['product', 'analytics', 'user-research']
      });
      await pm.save();

      // 4. Create a project
      const project = await projectRepo.create({
        name: 'Mobile App Launch',
        description: 'Launch the company mobile application',
        status: 'active',
        startDate: new Date(),
        priority: 'high',
        budget: 100000
      });
      await project.save();

      // Verify all entities were created successfully
      expect(company.getId()).toBeDefined();
      expect(engineeringTeam.getId()).toBeDefined();
      expect(productTeam.getId()).toBeDefined();
      expect(cto.getId()).toBeDefined();
      expect(engineer.getId()).toBeDefined();
      expect(pm.getId()).toBeDefined();
      expect(project.getId()).toBeDefined();

      // Store for use in relationship tests
      testCompanies.push(company);
      testTeams.push(engineeringTeam, productTeam);
      testUsers.push(cto, engineer, pm);
    });

    it('should handle content creation workflow', async () => {
      // Create author
      const author = await userRepo.create({
        username: 'content_creator',
        email: 'creator@example.com',
        firstName: 'Content',
        lastName: 'Creator',
        bio: 'Technical writer and developer',
        createdAt: new Date(),
        isActive: true
      });
      await author.save();

      // Create posts
      const posts = [
        {
          title: 'Getting Started with Neo4j',
          content: 'A comprehensive guide to graph databases...',
          slug: 'getting-started-neo4j',
          status: 'published' as const,
          createdAt: new Date(),
          publishedAt: new Date(),
          viewCount: 0,
          tags: ['neo4j', 'database', 'tutorial']
        },
        {
          title: 'Advanced Cypher Queries',
          content: 'Deep dive into complex graph queries...',
          slug: 'advanced-cypher-queries',
          status: 'draft' as const,
          createdAt: new Date(),
          viewCount: 0,
          tags: ['cypher', 'neo4j', 'advanced']
        }
      ];

      for (const postData of posts) {
        const post = await postRepo.create(postData);
        await post.save();
        testPosts.push(post);
      }

      // Create comments
      const comment1 = await commentRepo.create({
        content: 'Great tutorial! Very helpful for beginners.',
        createdAt: new Date(),
        isEdited: false
      });
      await comment1.save();

      const comment2 = await commentRepo.create({
        content: 'Looking forward to the advanced queries post!',
        createdAt: new Date(),
        isEdited: false
      });
      await comment2.save();

      // Verify content creation
      expect(testPosts).toHaveLength(2);
      expect(testPosts[0].status).toBe('published');
      expect(testPosts[1].status).toBe('draft');
      expect(comment1.getId()).toBeDefined();
      expect(comment2.getId()).toBeDefined();
    });
  });

  describe('Query Builder Integration', () => {
    beforeEach(async () => {
      // Create test data for query scenarios
      const company = await companyRepo.create({
        name: 'Query Test Corp',
        industry: 'Technology'
      });
      await company.save();

      const users = [
        { username: 'query_user1', email: 'qu1@test.com', firstName: 'Alice', lastName: 'Query', age: 25 },
        { username: 'query_user2', email: 'qu2@test.com', firstName: 'Bob', lastName: 'Query', age: 30 },
        { username: 'query_user3', email: 'qu3@test.com', firstName: 'Carol', lastName: 'Query', age: 35 }
      ];

      for (const userData of users) {
        const user = await userRepo.create(userData);
        await user.save();
        testUsers.push(user);
      }
    });

    it('should work with query builder for complex queries', async () => {
      // Test query builder integration
      const result = await neogm.queryBuilder()
        .match('(u:User)')
        .where({ 'u.lastName': 'Query' })
        .return('u.username as username, u.age as age')
        .orderBy('u.age', 'ASC')
        .execute();

      expect(result.records).toHaveLength(3);
      expect(result.records[0].username).toBe('query_user1');
      expect(result.records[0].age).toBe(25);
      expect(result.records[2].age).toBe(35);
    });

    it('should work with raw queries', async () => {
      const result = await neogm.rawQuery().execute(`
        MATCH (u:User)
        WHERE u.age > $minAge
        RETURN u.username, u.age
        ORDER BY u.age DESC
      `, { minAge: 28 });

      expect(result.records).toHaveLength(2);
      expect(result.records[0].u.properties.age).toBe(35);
      expect(result.records[1].u.properties.age).toBe(30);
    });
  });

  describe('Performance and Bulk Operations', () => {
    it('should handle bulk entity creation efficiently', async () => {
      const startTime = Date.now();
      const bulkUsers: User[] = [];

      // Create 50 users
      for (let i = 0; i < 50; i++) {
        const user = await userRepo.create({
          username: `bulk_user_${i}`,
          email: `bulk${i}@example.com`,
          firstName: `User`,
          lastName: `${i}`,
          age: 20 + (i % 30),
          createdAt: new Date(),
          isActive: true
        });
        await user.save();
        bulkUsers.push(user);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(bulkUsers).toHaveLength(50);
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds

      // Verify they're all in the database
      const count = await userRepo.count();
      expect(count).toBeGreaterThanOrEqual(50);
    });

    it('should handle concurrent operations', async () => {
      const promises: Promise<User>[] = [];

      // Create 10 users concurrently
      for (let i = 0; i < 10; i++) {
        const promise = (async () => {
          const user = await userRepo.create({
            username: `concurrent_user_${i}`,
            email: `concurrent${i}@example.com`,
            firstName: 'Concurrent',
            lastName: `User${i}`,
            createdAt: new Date()
          });
          return await user.save();
        })();
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(user => user.getId() !== undefined)).toBe(true);
    });
  });
});