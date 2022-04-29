import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';
import * as arweave from '..';
import { Podcast } from '../../interfaces';
import { findMetadata, hasMetadata } from '../../../utils';
import { getMetadataBatchNumber } from '../create-transaction';
import { rightDiff } from './diff-merge-logic';

/** To reduce the size per transaction */
const MAX_EPISODES_PER_BATCH = 50;
/** Fail-safe through which we sync max 1000 episodes per podcast */
const MAX_BATCHES = 20;

export interface ArSyncTransaction<T> {
  subscribeUrl: string,
  title?: string,
  resultObj: T,
  metadata: Podcast,
}

export async function initArSyncTxs(subscriptions: Podcast[],
  metadataToSync: Partial<Podcast>[], wallet: JWKInterface) {

  const txs : ArSyncTransaction<Transaction>[] = [];
  const failedTxs : ArSyncTransaction<Error>[] = [];
  const partitionedMetadataToSync : Partial<Podcast>[] = [];

  metadataToSync.forEach(podcastMetadataToSync => {
    if (hasMetadata(podcastMetadataToSync)) {
      const { subscribeUrl } = podcastMetadataToSync;
      const cachedMetadata = findMetadata(subscribeUrl!, subscriptions);

      // A transaction will be created for each batchesToSync[i]
      const batchesToSync = partitionMetadataBatches(cachedMetadata, podcastMetadataToSync);
      partitionedMetadataToSync.push(...batchesToSync);
    }
  });

  await Promise.all(partitionedMetadataToSync.map(async podcastToSync => {
    if (hasMetadata(podcastToSync)) {
      const { subscribeUrl } = podcastToSync;
      const cachedMetadata = findMetadata(subscribeUrl!, subscriptions);
      let newTxResult;
      try {
        newTxResult = await arweave.newMetadataTransaction(wallet, podcastToSync, cachedMetadata);
      }
      catch (ex) {
        newTxResult = ex;
      }
      const status = {
        subscribeUrl,
        title: cachedMetadata.title,
        resultObj: newTxResult,
        metadata: podcastToSync,
      };
      status.resultObj instanceof Error ? failedTxs.push(status as ArSyncTransaction<Error>)
        : txs.push(status as ArSyncTransaction<Transaction>);
    }
  }));
  console.debug('initArSyncTxs txs=', txs);
  console.debug('initArSyncTxs failedTxs=', failedTxs);

  return { txs, failedTxs };
}

export async function startSync(pendingTxs: ArSyncTransaction<Transaction>[],
  wallet: JWKInterface) {

  const txs : ArSyncTransaction<Transaction>[] = [];
  const failedTxs : ArSyncTransaction<Error>[] = [];

  await Promise.all(pendingTxs.map(async pendingTx => {
    let postedTxResult;
    try {
      postedTxResult = await arweave.signAndPostTransaction(pendingTx.resultObj, wallet);
    }
    catch (ex) {
      postedTxResult = ex;
    }
    const status = {
      ...pendingTx,
      resultObj: postedTxResult,
    };
    postedTxResult instanceof Error ? failedTxs.push(status as ArSyncTransaction<Error>)
      : txs.push(status as ArSyncTransaction<Transaction>);
  }));
  console.debug('startSync txs=', txs);
  console.debug('startSync failedTxs=', failedTxs);

  return { txs, failedTxs };
}

/**
 * TODO: split by JSON.stringify(compress(batchMetadata)) instead of MAX_EPISODES_PER_BATCH
 * @param cachedMetadata
 * @param podcastMetadataToSync
 * @returns {Array.<Object>}
 *   A array of partitioned `podcastMetadata`, which when merged should equal `podcastMetadata`.
 */
function partitionMetadataBatches(cachedMetadata: Partial<Podcast>,
  podcastMetadataToSync: Partial<Podcast>) {

  const { episodes, ...mainMetadata } = { ...podcastMetadataToSync };
  if (!hasMetadata(episodes)) return [podcastMetadataToSync];

  // Episodes are sorted from new to old
  const firstBatch = { ...mainMetadata, episodes: (episodes || []).slice(-MAX_EPISODES_PER_BATCH) };
  const firstBatchNumber = getMetadataBatchNumber(cachedMetadata,
    firstBatch.episodes[firstBatch.episodes.length - 1].publishedAt,
    firstBatch.episodes[0].publishedAt);

  const batches : Partial<Podcast>[] = [{ ...firstBatch, metadataBatch: firstBatchNumber }];
  const numBatches = Math.min(MAX_BATCHES, Math.ceil(episodes.length / MAX_EPISODES_PER_BATCH));

  for (let count = 2; count <= numBatches; count++) {
    const currentBatch = {
      ...mainMetadata,
      episodes: (episodes || [])
        .slice(-(MAX_EPISODES_PER_BATCH * count), -(MAX_EPISODES_PER_BATCH * (count - 1))),
    };
    const previousVsCurrentDiff =
      rightDiff(batches[count - 2], currentBatch, ['subscribeUrl', 'title']);
    batches.push({ ...previousVsCurrentDiff, metadataBatch: (firstBatchNumber + count - 1) });
  }

  return batches.filter(batch => hasMetadata(batch));
}

export function formatNewMetadataToSync(txs: ArSyncTransaction<Transaction>[],
  prevMetadataToSync: Partial<Podcast>[] = []) {

  let diffs = prevMetadataToSync;

  txs.forEach(tx => {
    const { subscribeUrl, metadata } = tx;
    const prevSynchedPodcastDiff = findMetadata(subscribeUrl, diffs);
    let newDiff : Partial<Podcast> = {};
    if (hasMetadata(prevSynchedPodcastDiff)) newDiff = rightDiff(metadata, prevSynchedPodcastDiff);

    diffs = diffs.filter(oldDiff => oldDiff.subscribeUrl !== subscribeUrl);
    if (hasMetadata(newDiff)) diffs.push(newDiff);
  });

  return diffs;
}
