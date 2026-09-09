import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  // `testData.ts` is a shared test helper, not a spec file — Jest's default
  // testMatch otherwise treats every file under __tests__/ as a suite.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/testData\\.ts$'],
};

export default config;
