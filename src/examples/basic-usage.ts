import { NeoGM, Node, Property, Relationship, BaseEntity } from '..';
import 'reflect-metadata';

// Define our entities using decorators
@Node('Person')
class Person extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property({ required: true })
  email!: string;

  @Property({ type: 'number' })
  age?: number;

  @Relationship('KNOWS', () => Person, { direction: 'out' })
  friends?: Person[];

  @Relationship('WORKS_FOR', () => Company, { direction: 'out' })
  employer?: Company;
}

@Node('Company')
class Company extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property()
  industry?: string;

  @Relationship('WORKS_FOR', () => Person, { direction: 'in' })
  employees?: Person[];
}

async function basicExample() {
  // Initialize the ORM with connection config
  const neogm = new NeoGM({
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'password',
    database: 'neo4j'
  });

  try {
    // Connect to the database
    await neogm.connect();
    console.log('Connected to Neo4j');

    // Clear database for clean start
    await neogm.clearDatabase();

    // Get repositories
    const personRepo = neogm.getRepository(Person);
    const companyRepo = neogm.getRepository(Company);

    // Create entities
    const alice = neogm.createEntity(Person, {
      name: 'Alice Smith',
      age: 30,
      email: 'alice@example.com'
    });

    const bob = neogm.createEntity(Person, {
      name: 'Bob Johnson',
      age: 25,
      email: 'bob@example.com'
    });

    const company = neogm.createEntity(Company, {
      name: 'TechCorp',
      industry: 'Technology'
    });

    // Save entities to database
    await personRepo.save(alice);
    await personRepo.save(bob);
    await companyRepo.save(company);

    console.log('Created entities:', {
      alice: alice.getId(),
      bob: bob.getId(),
      company: company.getId()
    });

    // Create relationships using raw queries (for now)
    await neogm.rawQuery().execute(`
      MATCH (a:Person), (b:Person)
      WHERE ID(a) = $aliceId AND ID(b) = $bobId
      CREATE (a)-[:KNOWS {since: 2020, type: 'friend'}]->(b)
    `, { aliceId: alice.getId(), bobId: bob.getId() });

    await neogm.rawQuery().execute(`
      MATCH (p:Person), (c:Company)
      WHERE ID(p) = $personId AND ID(c) = $companyId
      CREATE (p)-[:WORKS_FOR {position: $position, startDate: $startDate}]->(c)
    `, { 
      personId: alice.getId(), 
      companyId: company.getId(),
      position: 'Software Engineer',
      startDate: '2021-01-15'
    });

    await neogm.rawQuery().execute(`
      MATCH (p:Person), (c:Company)
      WHERE ID(p) = $personId AND ID(c) = $companyId
      CREATE (p)-[:WORKS_FOR {position: $position, startDate: $startDate}]->(c)
    `, { 
      personId: bob.getId(), 
      companyId: company.getId(),
      position: 'Product Manager',
      startDate: '2021-03-01'
    });

    console.log('Created relationships');

    // Repository query examples
    
    // Find all people
    const allPeople = await personRepo.find();
    console.log('All people:', allPeople.map(p => p.name));

    // Find person by property
    const foundPerson = await personRepo.findOne({ name: 'Alice Smith' });
    console.log('Found person:', foundPerson?.name);

    // Find people by age
    const adults = await personRepo.find({ where: { age: 30 } });
    console.log('People aged 30:', adults.map(p => p.name));

    // Find person by ID
    const personById = await personRepo.findById(alice.getId()!);
    console.log('Found by ID:', personById?.name);

    // Query builder example
    const employeeQuery = await neogm.queryBuilder()
      .match('(p:Person)-[:WORKS_FOR]->(c:Company)')
      .where({ 'c.name': 'TechCorp' })
      .return('p.name as name, p.email as email')
      .execute();

    console.log('Company employees:', employeeQuery.records.map(r => ({
      name: r.get('name'),
      email: r.get('email')
    })));

    // Raw query example
    const connectionQuery = await neogm.rawQuery().execute(`
      MATCH (a:Person)-[:KNOWS]-(b:Person)
      RETURN a.name as person1, b.name as person2
    `);

    console.log('Friendships:', connectionQuery.records.map(r => ({
      person1: r.get('person1'),
      person2: r.get('person2')
    })));

    // Transaction example
    await neogm.executeInTransaction(async (tx) => {
      await tx.run('CREATE (p:Person {id: $id, name: $name, age: $age, email: $email})', {
        id: 'charlie-id',
        name: 'Charlie Brown',
        age: 35,
        email: 'charlie@example.com'
      });
      
      await tx.run(`
        MATCH (p:Person {id: $personId}), (c:Company {name: $companyName})
        CREATE (p)-[:WORKS_FOR {position: $position}]->(c)
      `, {
        personId: 'charlie-id',
        companyName: 'TechCorp',
        position: 'Senior Developer'
      });
    });

    console.log('Transaction completed');

    // Verify transaction
    const totalEmployees = await neogm.rawQuery().execute(`
      MATCH ()-[r:WORKS_FOR]->()
      RETURN count(r) as count
    `);
    console.log('Total employees:', totalEmployees.records[0].get('count').toNumber());

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Always disconnect
    await neogm.disconnect();
    console.log('Disconnected from Neo4j');
  }
}

// Run the example
if (require.main === module) {
  basicExample().catch(console.error);
}