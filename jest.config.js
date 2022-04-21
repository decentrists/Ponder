const path = require('path');

module.exports = {
  testPathIgnorePatterns: ['cypress'],
  setupFilesAfterEnv: [path.resolve('jest.setup.js')],
};
