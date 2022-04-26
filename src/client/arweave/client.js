import Arweave from 'arweave';

const client = Arweave.init({
  host: 'localhost',
  port: 1984,
  protocol: 'http',
  timeout: 20000,
  logging: true,
});
window.arApi = client;

export default client;
