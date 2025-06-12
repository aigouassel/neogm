module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.ts'
  ],

  // Test patterns - using only testMatch (not testRegex)
  testMatch: [
    '**/tests/**/*.spec.ts',   // Unit tests
    '**/tests/**/*.test.ts',   // Integration tests
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