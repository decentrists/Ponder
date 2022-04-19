const path = require('path');

module.exports = {
  testPathIgnorePatterns: ['cypress'],
  setupFiles: [
    'jest-date-mock',
  ],
  setupFilesAfterEnv: [path.resolve('jest.setup.js')],
};
