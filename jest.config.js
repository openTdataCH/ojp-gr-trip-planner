/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  transform: {},
  verbose: true,
  testEnvironmentOptions: {
    url: "http://localhost"
  },
  rootDir: "./",
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/src/$1",
    "@/": "<rootDir>/src/",
  },
  roots: [
    "<rootDir>/__tests__/",
  ],
  modulePaths: [
    "<rootDir>/src/",
  ],
  moduleDirectories: [
    "node_modules",
    "src",
    "<rootDir>/src/",
  ],
  testMatch: [
    '<rootDir>/**/*.test.ts',

  ],
};