export const addTag = jest.fn();
export const createTransaction = jest.fn().mockResolvedValue({ addTag });

export const transactions = {
  sign: jest.fn(),
  post: jest.fn(),
  getData: jest.fn(),
};

export const api = {
  post: jest.fn(),
};

const client = {
  createTransaction,
  transactions,
  api,
};

export default client;
