import Arweave from 'arweave';
import { ApiConfig } from 'arweave/node/lib/api.d';

declare global {
  interface Window {
    arApi : Arweave;
  }
}

const config : ApiConfig = {
  host: 'localhost',
  port: 1984,
  protocol: 'http',
  timeout: 20000,
  logging: true,
};
const client = Arweave.init(config);
window.arApi = client;

export default client;
