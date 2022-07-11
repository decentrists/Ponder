import Arweave from 'arweave';
import { ApiConfig } from 'arweave/node/lib/api.d';

declare global {
  interface Window {
    arApi : Arweave;
    arb: any;
  }
}

const USE_ARLOCAL = (process.env.REACT_APP_USE_ARLOCAL as string) === 'true';

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

const client = Arweave.init(USE_ARLOCAL ? ARLOCAL_CONFIG : MAINNET_CONFIG);
window.arApi = client;

export default client;
