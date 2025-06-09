import { NeoGM } from '../src';

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

    // Create nodes
    const alice = neogm.createNode('Person', {
      name: 'Alice Smith',
      age: 30,
      email: 'alice@example.com'
    });

    const bob = neogm.createNode('Person', {
      name: 'Bob Johnson',
      age: 25,
      email: 'bob@example.com'
    });

    const company = neogm.createNode('Company', {
      name: 'TechCorp',
      industry: 'Technology'
    });

    // Save nodes to database
    await alice.save();
    await bob.save();
    await company.save();

    console.log('Created nodes:', {
      alice: alice.getId(),
      bob: bob.getId(),
      company: company.getId()
    });

    // Create relationships
    const friendship = neogm.createRelationship('KNOWS', alice, bob, {
      since: 2020,
      type: 'friend'
    });

    const employment1 = neogm.createRelationship('WORKS_FOR', alice, company, {
      position: 'Software Engineer',
      startDate: '2021-01-15'
    });

    const employment2 = neogm.createRelationship('WORKS_FOR', bob, company, {
      position: 'Product Manager',
      startDate: '2021-03-01'
    });

    // Save relationships
    await friendship.save();
    await employment1.save();
    await employment2.save();

    console.log('Created relationships');

    // Query examples
    
    // Find all people
    const allPeople = await neogm.findNodes('Person');
    console.log('All people:', allPeople.map(p => p.getProperty('name')));

    // Find person by name
    const foundPerson = await neogm.findOneNode('Person', { name: 'Alice Smith' });
    console.log('Found person:', foundPerson?.getProperty('name'));

    // Find people over 25
    const adults = await neogm.findNodes('Person', { age: 30 });
    console.log('People over 25:', adults.map(p => p.getProperty('name')));

    // Query builder example
    const employeeQuery = await neogm.queryBuilder()
      .match('(p:Person)-[:WORKS_FOR]->(c:Company)')
      .where({ 'c.name': 'TechCorp' })
      .return('p.name as name, p.email as email')
      .execute();

    console.log('Company employees:', employeeQuery.records);

    // Raw query example
    const connectionQuery = await neogm.rawQuery().execute(`
      MATCH (a:Person)-[:KNOWS]-(b:Person)
      RETURN a.name as person1, b.name as person2
    `);

    console.log('Friendships:', connectionQuery.records);

    // Transaction example
    await neogm.executeInTransaction(async (tx) => {
      await tx.run('CREATE (p:Person {name: $name, age: $age})', {
        name: 'Charlie Brown',
        age: 35
      });
      
      await tx.run(`
        MATCH (p:Person {name: $name}), (c:Company {name: $companyName})
        CREATE (p)-[:WORKS_FOR {position: $position}]->(c)
      `, {
        name: 'Charlie Brown',
        companyName: 'TechCorp',
        position: 'Senior Developer'
      });
    });

    console.log('Transaction completed');

    // Verify transaction
    const allEmployees = await neogm.findRelationships('WORKS_FOR');
    console.log('Total employees:', allEmployees.length);

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