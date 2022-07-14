import axios from 'axios';
import { formatArweaveUrl } from '../arweave/client';

export async function fetchArweaveUrlData(path: string) : Promise<Uint8Array> {
  const url = formatArweaveUrl(path);
  let response;
  try {
    response = await axios.get(url, { responseType: 'arraybuffer', decompress: false });
  }
  catch (ex) {
    throw new Error(`Error fetching metadata from ${url}: ${ex}`);
  }

  return new Uint8Array(response.data as ArrayBuffer);
}
