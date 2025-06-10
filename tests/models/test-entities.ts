import { Node, Property, Relationship } from '../../src/lib/decorators';
import { BaseEntity } from '../../src/lib/entity';

// User entity with comprehensive property examples
@Node('User')
export class User extends BaseEntity {
  @Property({ required: true, unique: true })
  username!: string;

  @Property({ 
    required: true,
    validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  })
  email!: string;

  @Property({ required: true })
  firstName!: string;

  @Property({ required: true })
  lastName!: string;

  @Property({
    validator: (age: number) => age >= 13 && age <= 120
  })
  age?: number;

  @Property()
  bio?: string;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  lastLoginAt?: Date;

  @Property()
  isActive?: boolean;

  @Property({
    validator: (tags: string[]) => Array.isArray(tags) && tags.length <= 10
  })
  tags?: string[];

  // Relationships
  @Relationship('FOLLOWS', () => User, { direction: 'out' })
  following?: User[];

  @Relationship('FOLLOWS', () => User, { direction: 'in' })
  followers?: User[];

  @Relationship('WORKS_AT', () => Company)
  currentCompany?: Company;

  @Relationship('CREATED', () => Post, { direction: 'out' })
  posts?: Post[];

  @Relationship('LIKES', () => Post, { direction: 'out' })
  likedPosts?: Post[];

  @Relationship('MEMBER_OF', () => Team, { direction: 'out' })
  teams?: Team[];

  // Computed property example
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// Company entity
@Node('Company')
export class Company extends BaseEntity {
  @Property({ required: true, unique: true })
  name!: string;

  @Property()
  description?: string;

  @Property({
    validator: (website: string) => /^https?:\/\/.+/.test(website)
  })
  website?: string;

  @Property({
    validator: (year: number) => year >= 1800 && year <= new Date().getFullYear()
  })
  foundedYear?: number;

  @Property()
  industry?: string;

  @Property()
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

  @Property({
    transformer: {
      to: (location: { city: string; country: string }) => JSON.stringify(location),
      from: (json: string) => JSON.parse(json)
    }
  })
  headquarters?: { city: string; country: string };

  @Property()
  isPublic?: boolean;

  // Relationships
  @Relationship('WORKS_AT', () => User, { direction: 'in' })
  employees?: User[];

  @Relationship('HAS_TEAM', () => Team, { direction: 'out' })
  teams?: Team[];
}

// Team entity
@Node('Team')
export class Team extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property()
  description?: string;

  @Property()
  department?: string;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Property()
  isActive?: boolean;

  // Relationships
  @Relationship('HAS_TEAM', () => Company, { direction: 'in' })
  company?: Company;

  @Relationship('MEMBER_OF', () => User, { direction: 'in' })
  members?: User[];

  @Relationship('LEADS', () => User, { direction: 'in' })
  teamLead?: User;
}

// Post entity for content management
@Node('Post')
export class Post extends BaseEntity {
  @Property({ required: true })
  title!: string;

  @Property({ required: true })
  content!: string;

  @Property()
  slug?: string;

  @Property({
    validator: (status: string) => ['draft', 'published', 'archived'].includes(status)
  })
  status?: 'draft' | 'published' | 'archived';

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  publishedAt?: Date;

  @Property()
  viewCount?: number;

  @Property()
  tags?: string[];

  // Relationships
  @Relationship('CREATED', () => User, { direction: 'in' })
  author?: User;

  @Relationship('LIKES', () => User, { direction: 'in' })
  likedBy?: User[];

  @Relationship('COMMENTED_ON', () => Comment, { direction: 'in' })
  comments?: Comment[];
}

// Comment entity
@Node('Comment')
export class Comment extends BaseEntity {
  @Property({ required: true })
  content!: string;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  createdAt?: Date;

  @Property()
  isEdited?: boolean;

  // Relationships
  @Relationship('COMMENTED_ON', () => Post, { direction: 'out' })
  post?: Post;

  @Relationship('WROTE', () => User, { direction: 'in' })
  author?: User;

  @Relationship('REPLY_TO', () => Comment, { direction: 'out' })
  parentComment?: Comment;

  @Relationship('REPLY_TO', () => Comment, { direction: 'in' })
  replies?: Comment[];
}

// Project entity for work management
@Node('Project')
export class Project extends BaseEntity {
  @Property({ required: true })
  name!: string;

  @Property()
  description?: string;

  @Property()
  status?: 'planning' | 'active' | 'completed' | 'cancelled';

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  startDate?: Date;

  @Property({
    transformer: {
      to: (date: Date) => date.toISOString(),
      from: (isoString: string) => new Date(isoString)
    }
  })
  endDate?: Date;

  @Property({
    validator: (priority: string) => ['low', 'medium', 'high', 'critical'].includes(priority)
  })
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @Property()
  budget?: number;

  // Relationships
  @Relationship('OWNS', () => Company, { direction: 'in' })
  ownerCompany?: Company;

  @Relationship('ASSIGNED_TO', () => User, { direction: 'out' })
  assignedUsers?: User[];

  @Relationship('MANAGED_BY', () => User, { direction: 'out' })
  projectManager?: User;

  @Relationship('WORKED_ON_BY', () => Team, { direction: 'out' })
  assignedTeams?: Team[];
}