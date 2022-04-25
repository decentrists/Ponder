import * as arweave from '..';
import { findMetadata, hasMetadata } from '../../../utils';

export async function initArSyncTxs(subscriptions, metadataToSync, wallet) {
  const txs = [];
  const failedTxs = [];

  await Promise.all(metadataToSync.map(async podcastToSync => {
    if (hasMetadata(podcastToSync)) {
      const { subscribeUrl } = podcastToSync;
      const cachedMetadata = findMetadata(subscribeUrl, subscriptions);
      let newTxResult;
      try {
        newTxResult = await arweave.newMetadataTransaction(wallet, podcastToSync, cachedMetadata);
      }
      catch (ex) {
        newTxResult = ex;
      }
      finally {
        (newTxResult instanceof Error ? failedTxs : txs).push({
          subscribeUrl,
          title: cachedMetadata.title,
          resultObj: newTxResult,
          metadata: podcastToSync,
        });
      }
    }
  }));
  console.debug('initArSyncTxs txs=', txs);
  console.debug('initArSyncTxs failedTxs=', failedTxs);

  return { txs, failedTxs };
}

export async function startSync(pendingTxs, wallet) {
  const txs = [];
  const failedTxs = [];

  await Promise.all(pendingTxs.map(async pendingTx => {
    let postedTxResult;
    try {
      postedTxResult = await arweave.signAndPostTransaction(pendingTx.resultObj, wallet);
    }
    catch (ex) {
      postedTxResult = ex;
    }
    finally {
      (postedTxResult instanceof Error ? failedTxs : txs).push({
        ...pendingTx,
        resultObj: postedTxResult,
      });
    }
  }));
  console.debug('startSync txs=', txs);
  console.debug('startSync failedTxs=', failedTxs);

  return { txs, failedTxs };
}

export function formatNewMetadataToSync(failedTxs) {
  return failedTxs.map(elem => elem.metadata);
}
