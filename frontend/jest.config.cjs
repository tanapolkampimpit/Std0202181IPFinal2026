module.exports = {
  preset: 'jest-expo',
  testTimeout: 15000,
  testMatch: ['**/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', 'App.js'],
};
