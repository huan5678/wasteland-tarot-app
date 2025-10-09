/**
 * Jest Configuration for Audio System Tests
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'audio-system',
  testMatch: [
    '<rootDir>/src/lib/audio/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/hooks/audio/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/components/audio/__tests__/**/*.test.{ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/lib/audio/**/*.{ts,tsx}',
    'src/hooks/audio/**/*.{ts,tsx}',
    'src/components/audio/**/*.{tsx}',
    '!src/lib/audio/__tests__/**',
    '!src/hooks/audio/__tests__/**',
    '!src/components/audio/__tests__/**',
    '!src/lib/audio/types.ts',
    '!src/lib/audio/constants.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
