"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
require("reflect-metadata");
// Define our entities using decorators
let Person = class Person extends __1.BaseEntity {
};
__decorate([
    (0, __1.Property)({ required: true }),
    __metadata("design:type", String)
], Person.prototype, "name", void 0);
__decorate([
    (0, __1.Property)({ required: true }),
    __metadata("design:type", String)
], Person.prototype, "email", void 0);
__decorate([
    (0, __1.Property)({ type: 'number' }),
    __metadata("design:type", Number)
], Person.prototype, "age", void 0);
__decorate([
    (0, __1.Relationship)('KNOWS', () => Person, { direction: 'out' }),
    __metadata("design:type", Array)
], Person.prototype, "friends", void 0);
__decorate([
    (0, __1.Relationship)('WORKS_FOR', () => Company, { direction: 'out' }),
    __metadata("design:type", Company)
], Person.prototype, "employer", void 0);
Person = __decorate([
    (0, __1.Node)('Person')
], Person);
let Company = class Company extends __1.BaseEntity {
};
__decorate([
    (0, __1.Property)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, __1.Property)(),
    __metadata("design:type", String)
], Company.prototype, "industry", void 0);
__decorate([
    (0, __1.Relationship)('WORKS_FOR', () => Person, { direction: 'in' }),
    __metadata("design:type", Array)
], Company.prototype, "employees", void 0);
Company = __decorate([
    (0, __1.Node)('Company')
], Company);
async function basicExample() {
    // Initialize the ORM with connection config
    const neogm = new __1.NeoGM({
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
        const personById = await personRepo.findById(alice.getId());
        console.log('Found by ID:', personById?.name);
        // Query builder example
        const employeeQuery = await neogm.queryBuilder()
            .match('(p:Person)-[:WORKS_FOR]->(c:Company)')
            .where({ 'c.name': 'TechCorp' })
            .return('p.name as name, p.email as email')
            .execute();
        console.log('Company employees:', employeeQuery.records.map(r => ({
            name: r.name,
            email: r.email
        })));
        // Raw query example
        const connectionQuery = await neogm.rawQuery().execute(`
      MATCH (a:Person)-[:KNOWS]-(b:Person)
      RETURN a.name as person1, b.name as person2
    `);
        console.log('Friendships:', connectionQuery.records.map(r => ({
            person1: r.person1,
            person2: r.person2
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
        console.log('Total employees:', totalEmployees.records[0].count);
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        // Always disconnect
        await neogm.disconnect();
        console.log('Disconnected from Neo4j');
    }
}
// Run the example
if (require.main === module) {
    basicExample().catch(console.error);
}
//# sourceMappingURL=basic-usage.js.map