const path = require('path');

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['cypress'],
  setupFiles: [
    'jest-environment-jsdom',
    'jest-date-mock',
  ],
  setupFilesAfterEnv: [path.resolve('jest.setup.js')],
  testURL: 'https://thejimmydoreshow.libsyn.com/',
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
};
