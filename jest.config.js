module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/lib/data-access/__tests__/utils/jest-setup.ts'
  ],
  
  // Test categories
  testMatch: [
    '**/__tests__/**/*.spec.ts',   // Unit tests
    '**/__tests__/**/*.test.ts',   // Integration tests
  ],
  
  // Custom test runners
  testRunner: 'jest-circus/runner',
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  
  // Timeout for tests (in milliseconds)
  testTimeout: 30000,
};