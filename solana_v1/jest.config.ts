import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  // `testData.ts`/`txHelpers.ts` are shared test helpers, not spec files —
  // Jest's default testMatch otherwise treats every file under __tests__/ as
  // a suite.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/testData\\.ts$',
    '/__tests__/txHelpers\\.ts$',
  ],
};

export default config;
