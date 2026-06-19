const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: path.resolve(__dirname, '../..'),
  testMatch: ['<rootDir>/apps/api/src/__tests__/**/*.test.ts'],
  verbose: true,
  forceExit: true,
};
