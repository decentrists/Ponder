import { TransactionStatusResponse } from 'arweave/node/transactions';
import { ArSyncTx, BundledTxIdMapping, DispatchResultDTO } from '../interfaces';
import client from './client';
import { getArBundledParentIds } from './graphql-ops';
import { getBundleTxId, getTxId, isBundled } from './utils';

export { getPodcastFeed } from './graphql-ops';
export { createNewDevWallet, getWalletAddress } from './wallet';
export {
  newMetadataTransaction,
  signAndPostTransaction,
  dispatchTransaction,
} from './create-transaction';

export async function getTxConfirmationStatus(arSyncTx: ArSyncTx)
  : Promise<TransactionStatusResponse> {
  let result : TransactionStatusResponse;
  try {
    const txId : string = getBundleTxId(arSyncTx) || getTxId(arSyncTx);
    result = await client.transactions.getStatus(txId);
  }
  catch (_ex) {
    result = { status: 404, confirmed: null };
  }

  return result;
}

/**
 * Generates a list of transaction id's that were Arbundled into parent transactions and missing
 * their parent transaction id's. Then fetches the parent id's using a single GraphQL call.
 * Returns only the arSyncTxs that were updated in this process.
 * @param arSyncTxs All/unfilter()ed arSyncTxs
 * @returns The arSyncTxs that were updated by population of the dispatchResult.bundledIn field
 */
export async function updateArBundledParentIds(arSyncTxs: ArSyncTx[]) : Promise<ArSyncTx[]> {
  const updatedArSyncTxs : ArSyncTx[] = [];
  const bundledArSyncTxs : ArSyncTx[] = arSyncTxs.filter(isBundled);
  const idsToLookUp : string[] = bundledArSyncTxs.filter(arSyncTx => !getBundleTxId(arSyncTx))
    .map(getTxId).filter(x => x);

  if (!idsToLookUp.length) return [] as ArSyncTx[];

  const mapping : BundledTxIdMapping = await getArBundledParentIds(idsToLookUp);
  Object.entries(mapping).forEach(([id, parentId]) => {
    const outdatedArSyncTx = bundledArSyncTxs.find(arSyncTx => arSyncTx.dispatchResult!.id === id);
    if (outdatedArSyncTx) {
      updatedArSyncTxs.push({
        ...outdatedArSyncTx,
        dispatchResult: {
          ...outdatedArSyncTx.dispatchResult,
          bundledIn: parentId,
        } as DispatchResultDTO,
      });
    }
  });

  return updatedArSyncTxs;
}
