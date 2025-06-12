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
exports.Company = exports.Person = void 0;
exports.exampleUsage = exampleUsage;
const neogm_1 = require("../lib/neogm");
const decorators_1 = require("../lib/decorators");
const entity_1 = require("../lib/entity");
// Example entity definitions using decorators
let Person = class Person extends entity_1.BaseEntity {
};
exports.Person = Person;
__decorate([
    (0, decorators_1.Property)({ required: true }),
    __metadata("design:type", String)
], Person.prototype, "name", void 0);
__decorate([
    (0, decorators_1.Property)({ required: true }),
    __metadata("design:type", String)
], Person.prototype, "email", void 0);
__decorate([
    (0, decorators_1.Property)(),
    __metadata("design:type", Number)
], Person.prototype, "age", void 0);
__decorate([
    (0, decorators_1.Property)({
        transformer: {
            to: (date) => date.toISOString(),
            from: (isoString) => new Date(isoString)
        }
    }),
    __metadata("design:type", Date)
], Person.prototype, "createdAt", void 0);
__decorate([
    (0, decorators_1.Relationship)('WORKS_FOR', () => Company),
    __metadata("design:type", Company)
], Person.prototype, "company", void 0);
__decorate([
    (0, decorators_1.Relationship)('FOLLOWS', () => Person, { direction: 'out' }),
    __metadata("design:type", Array)
], Person.prototype, "following", void 0);
__decorate([
    (0, decorators_1.Relationship)('FOLLOWS', () => Person, { direction: 'in' }),
    __metadata("design:type", Array)
], Person.prototype, "followers", void 0);
exports.Person = Person = __decorate([
    (0, decorators_1.Node)('Person')
], Person);
let Company = class Company extends entity_1.BaseEntity {
};
exports.Company = Company;
__decorate([
    (0, decorators_1.Property)({ required: true, unique: true }),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, decorators_1.Property)(),
    __metadata("design:type", String)
], Company.prototype, "website", void 0);
__decorate([
    (0, decorators_1.Property)({
        validator: (year) => year >= 1800 && year <= new Date().getFullYear()
    }),
    __metadata("design:type", Number)
], Company.prototype, "founded", void 0);
__decorate([
    (0, decorators_1.Relationship)('WORKS_FOR', () => Person, { direction: 'in' }),
    __metadata("design:type", Array)
], Company.prototype, "employees", void 0);
exports.Company = Company = __decorate([
    (0, decorators_1.Node)('Company')
], Company);
// Example usage
async function exampleUsage() {
    // Initialize NeoGM
    const neogm = new neogm_1.NeoGM({
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
    const personById = await personRepo.findById(person.getId());
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
//# sourceMappingURL=decorator-usage.js.map