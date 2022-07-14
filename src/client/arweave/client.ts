import Arweave from 'arweave';
import { ApiConfig } from 'arweave/node/lib/api.d';
import { usingArLocal } from './utils';

declare global {
  interface Window {
    arApi : Arweave;
  }
}

const ARLOCAL_CONFIG : ApiConfig = {
  host: 'localhost',
  port: 1984,
  protocol: 'http',
  timeout: 20000,
  logging: true,
} as const;

const MAINNET_CONFIG : ApiConfig = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 20000,
  logging: true, // TODO: switch to false in production?
} as const;

const client = Arweave.init(usingArLocal() ? ARLOCAL_CONFIG : MAINNET_CONFIG);
window.arApi = client;

export default client;
