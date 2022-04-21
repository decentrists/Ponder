import 'regenerator-runtime/runtime';
import '@testing-library/jest-dom';

global.console = {
  ...console,
  // uncomment to ignore a specific log level in stdout
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

afterEach(() => {
  jest.clearAllMocks();
});
