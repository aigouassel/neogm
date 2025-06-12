import { Node, Property, Relationship } from '../../src/lib/decorators';
import { BaseEntity } from '../../src/lib/entity';

// Use interfaces to avoid circular reference issues
interface IUser extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  bio?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
  isActive?: boolean;
  tags?: string[];
  following?: IUser[];
  followers?: IUser[];
  currentCompany?: ICompany;
  posts?: IPost[];
  likedPosts?: IPost[];
  teams?: ITeam[];
}

interface ICompany extends BaseEntity {
  name: string;
  description?: string;
  website?: string;
  foundedYear?: number;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  headquarters?: { city: string; country: string };
  isPublic?: boolean;
  employees?: IUser[];
  teams?: ITeam[];
}

interface ITeam extends BaseEntity {
  name: string;
  description?: string;
  department?: string;
  createdAt?: Date;
  isActive?: boolean;
  company?: ICompany;
  members?: IUser[];
  teamLead?: IUser;
}

interface IPost extends BaseEntity {
  title: string;
  content: string;
  slug?: string;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: Date;
  publishedAt?: Date;
  viewCount?: number;
  tags?: string[];
  author?: IUser;
  likedBy?: IUser[];
  comments?: IComment[];
}

interface IComment extends BaseEntity {
  content: string;
  createdAt?: Date;
  isEdited?: boolean;
  post?: IPost;
  author?: IUser;
  parentComment?: IComment;
  replies?: IComment[];
}

interface IProject extends BaseEntity {
  name: string;
  description?: string;
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  budget?: number;
  ownerCompany?: ICompany;
  assignedUsers?: IUser[];
  projectManager?: IUser;
  assignedTeams?: ITeam[];
}

// User entity with comprehensive property examples
@Node('User')
export class User extends BaseEntity implements IUser {
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
  following?: IUser[];

  @Relationship('FOLLOWS', () => User, { direction: 'in' })
  followers?: IUser[];

  @Relationship('WORKS_AT', () => Company)
  currentCompany?: ICompany;

  @Relationship('CREATED', () => Post, { direction: 'out' })
  posts?: IPost[];

  @Relationship('LIKES', () => Post, { direction: 'out' })
  likedPosts?: IPost[];

  @Relationship('MEMBER_OF', () => Team, { direction: 'out' })
  teams?: ITeam[];

  // Computed property example
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// Company entity
@Node('Company')
export class Company extends BaseEntity implements ICompany {
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
  employees?: IUser[];

  @Relationship('HAS_TEAM', () => Team, { direction: 'out' })
  teams?: ITeam[];
}

// Team entity
@Node('Team')
export class Team extends BaseEntity implements ITeam {
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
  company?: ICompany;

  @Relationship('MEMBER_OF', () => User, { direction: 'in' })
  members?: IUser[];

  @Relationship('LEADS', () => User, { direction: 'in' })
  teamLead?: IUser;
}

// Post entity for content management
@Node('Post')
export class Post extends BaseEntity implements IPost {
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
  author?: IUser;

  @Relationship('LIKES', () => User, { direction: 'in' })
  likedBy?: IUser[];

  @Relationship('COMMENTED_ON', () => Comment, { direction: 'in' })
  comments?: IComment[];
}

// Comment entity
@Node('Comment')
export class Comment extends BaseEntity implements IComment {
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
  post?: IPost;

  @Relationship('WROTE', () => User, { direction: 'in' })
  author?: IUser;

  @Relationship('REPLY_TO', () => Comment, { direction: 'out' })
  parentComment?: IComment;

  @Relationship('REPLY_TO', () => Comment, { direction: 'in' })
  replies?: IComment[];
}

// Project entity for work management
@Node('Project')
export class Project extends BaseEntity implements IProject {
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
  ownerCompany?: ICompany;

  @Relationship('ASSIGNED_TO', () => User, { direction: 'out' })
  assignedUsers?: IUser[];

  @Relationship('MANAGED_BY', () => User, { direction: 'out' })
  projectManager?: IUser;

  @Relationship('WORKED_ON_BY', () => Team, { direction: 'out' })
  assignedTeams?: ITeam[];
}

// Export alias for test compatibility
export { User as TestUser };