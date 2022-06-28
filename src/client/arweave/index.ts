import { TransactionStatusResponse } from 'arweave/node/transactions';
import client from './client';
import { TransactionDTO } from './sync';

export { getPodcastFeed } from './get-podcast-feed';

export { createNewDevWallet, getWalletAddress } from './wallet';

export { newMetadataTransaction, signAndPostTransaction } from './create-transaction';

export async function getTxConfirmationStatus(
  tx: TransactionDTO,
) : Promise<TransactionStatusResponse> {
  let result : TransactionStatusResponse;
  try {
    result = await client.transactions.getStatus(tx.id);
  }
  catch (_ex) {
    result = { status: 404, confirmed: null };
  }

  return result;
}
