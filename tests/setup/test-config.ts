import { NeoGMConfig } from '../../src/lib/types';

export const testConfig: NeoGMConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j'
};

export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));