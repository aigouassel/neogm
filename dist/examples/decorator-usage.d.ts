import { BaseEntity } from '../lib/entity';
declare class Person extends BaseEntity {
    name: string;
    email: string;
    age?: number;
    createdAt?: Date;
    company?: Company;
    following?: Person[];
    followers?: Person[];
}
declare class Company extends BaseEntity {
    name: string;
    website?: string;
    founded?: number;
    employees?: Person[];
}
declare function exampleUsage(): Promise<void>;
export { Person, Company, exampleUsage };
//# sourceMappingURL=decorator-usage.d.ts.map