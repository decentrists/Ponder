const path = require('path');
require('dotenv').config();

module.exports = {
  testPathIgnorePatterns: ['cypress'],
  setupFilesAfterEnv: [path.resolve('jest.setup.js')],
};
