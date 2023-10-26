/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['../../'],
  verbose:true,
  'modulePaths': ['<rootDir>', '<rootDir>/src', '<rootDir>/src/alpha'],
};

