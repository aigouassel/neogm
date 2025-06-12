import { NeoGM } from '../lib/neogm';
import { Node, Property, Relationship } from '../lib/decorators';
import { BaseEntity, Repository } from '../lib/entity';

// Example entity definitions using decorators
@Node('Person')
class Person extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property({ required: true })
  email!: string;

  @Property()
  age?: number;

  @Property({ 
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Relationship('WORKS_FOR', () => Company)
  company?: Company;

  @Relationship('FOLLOWS', () => Person, { direction: 'out' })
  following?: Person[];

  @Relationship('FOLLOWS', () => Person, { direction: 'in' })
  followers?: Person[];
}

@Node('Company')
class Company extends BaseEntity {
  @Property({ required: true, unique: true })
  name!: string;

  @Property()
  website?: string;

  @Property({ 
    validator: (year: number) => year >= 1800 && year <= new Date().getFullYear()
  })
  founded?: number;

  @Relationship('WORKS_FOR', () => Person, { direction: 'in' })
  employees?: Person[];
}

// Example usage
async function exampleUsage() {
  // Initialize NeoGM
  const neogm = new NeoGM({
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'your-password',
    database: 'neo4j'
  });

  await neogm.connect();

  // Create repositories
  const personRepo = neogm.getRepository(Person);
  const companyRepo = neogm.getRepository(Company);

  // Create entities using decorator-based approach
  const company = await companyRepo.create({
    name: 'TechCorp',
    website: 'https://techcorp.com',
    founded: 2015
  });
  await company.save();

  const person = await personRepo.create({
    name: 'Alice Johnson',
    email: 'alice@techcorp.com',
    age: 30,
    createdAt: new Date()
  });
  await person.save();

  // Find entities
  const allPeople = await personRepo.find();
  console.log('All people:', allPeople.map(p => p.toJSON()));

  const specificPerson = await personRepo.findOne({ name: 'Alice Johnson' });
  console.log('Found person:', specificPerson?.toJSON());

  const personById = await personRepo.findById(person.getId()!);
  console.log('Person by ID:', personById?.toJSON());

  // Update entity
  if (specificPerson) {
    specificPerson.age = 31;
    await specificPerson.save();
    console.log('Updated person:', specificPerson.toJSON());
  }

  // Count entities
  const personCount = await personRepo.count();
  console.log('Total people:', personCount);

  // Check existence
  const exists = await personRepo.exists({ email: 'alice@techcorp.com' });
  console.log('Person exists:', exists);

  // Delete entity
  if (person) {
    await person.delete();
    console.log('Person deleted');
  }

  await neogm.disconnect();
}

export { Person, Company, exampleUsage };