import { clear } from 'jest-date-mock';

global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  // error: jest.fn(),
};

afterEach(() => {
  clear();
  jest.clearAllMocks();
});
