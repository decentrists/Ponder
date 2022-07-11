import { v4 as uuid } from 'uuid';
import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { DispatchResult } from 'arconnect';
import {
  ArSyncTx,
  ArSyncTxStatus,
  Podcast,
} from '../../interfaces';
import {
  episodesCount,
  findMetadata,
  getFirstEpisodeDate,
  getLastEpisodeDate,
  hasMetadata,
} from '../../../utils';
import { getMetadataBatchNumber } from '../create-transaction';
import { mergeBatchMetadata, rightDiff } from './diff-merge-logic';
import { WalletDeferredToArConnect } from '../wallet';
import {
  isConfirmed,
  isInitialized,
  isPosted,
  usingArConnect,
} from '../utils';
import { newMetadataTransaction, dispatchTransaction, signAndPostTransaction } from '..';

/** To reduce the size per transaction */
const MAX_EPISODES_PER_BATCH = 100;
/** Fail-safe through which we sync max 2000 episodes per podcast */
const MAX_BATCHES = 1;

export async function initArSyncTxs(
  subscriptions: Podcast[],
  metadataToSync: Partial<Podcast>[],
  wallet: JWKInterface | WalletDeferredToArConnect,
)
  : Promise<ArSyncTx[]> {
  const result : ArSyncTx[] = [];
  const partitionedMetadataToSync : Partial<Podcast>[] = [];

  metadataToSync.forEach(podcastMetadataToSync => {
    let cachedMetadata : Partial<Podcast> = {};
    if (hasMetadata(podcastMetadataToSync)) {
      let subscribeUrl! : string;
      try {
        subscribeUrl = podcastMetadataToSync.subscribeUrl!;
        cachedMetadata = findMetadata(subscribeUrl, subscriptions);

        // A transaction will be created for each batchesToSync[i]
        const batchesToSync = partitionMetadataBatches(cachedMetadata, podcastMetadataToSync);
        partitionedMetadataToSync.push(...batchesToSync);
      }
      catch (ex) {
        console.error(`Failed to sync ${subscribeUrl} due to: ${ex}`);
      }
    }
  });

  await Promise.all(partitionedMetadataToSync.map(async podcastToSync => {
    if (hasMetadata(podcastToSync)) {
      let subscribeUrl! : string;
      let cachedMetadata : Partial<Podcast> = {};
      let newTxResult : Transaction | Error;
      try {
        subscribeUrl = podcastToSync.subscribeUrl!;
        cachedMetadata = findMetadata(subscribeUrl, subscriptions);
        newTxResult = await newMetadataTransaction(wallet, podcastToSync, cachedMetadata);
      }
      catch (ex) {
        newTxResult = ex as Error;
      }
      const arSyncTx : ArSyncTx = {
        id: uuid(),
        subscribeUrl,
        title: cachedMetadata.title || podcastToSync.title || '',
        resultObj: newTxResult,
        metadata: podcastToSync,
        numEpisodes: episodesCount(podcastToSync),
        status: newTxResult instanceof Error ? ArSyncTxStatus.ERRORED : ArSyncTxStatus.INITIALIZED,
      };
      result.push(arSyncTx);
    }
  }));
  console.debug('initArSyncTxs result:', result);

  return result;
}

export async function startSync(
  allTxs: ArSyncTx[],
  wallet: JWKInterface | WalletDeferredToArConnect,
)
  : Promise<ArSyncTx[]> {
  const result : ArSyncTx[] = [...allTxs];
  await Promise.all(allTxs.map(async (tx, index) => {
    if (isInitialized(tx)) {
      let postedTxResult : Transaction | Error = tx.resultObj as Transaction;
      let dispatchResult : DispatchResult | undefined;
      try {
        if (usingArConnect()) {
          dispatchResult = await dispatchTransaction(tx.resultObj as Transaction);
        }
        else await signAndPostTransaction(tx.resultObj as Transaction, wallet);
      }
      catch (ex) {
        postedTxResult = ex as Error;
      }
      const arSyncTx : ArSyncTx = {
        ...tx,
        dispatchResult,
        resultObj: postedTxResult,
        status: postedTxResult instanceof Error ? ArSyncTxStatus.ERRORED : ArSyncTxStatus.POSTED,
      };
      result[index] = arSyncTx;
    }
    else result[index] = tx;
  }));
  console.debug('startSync result:', result);

  return result;
}

/**
 * TODO: T262, split by compress(JSON.stringify(batchMetadata)).length instead of
 *       MAX_EPISODES_PER_BATCH.
 * @param cachedMetadata
 * @param podcastMetadataToSync
 * @returns An array of partitioned `podcastMetadataToSync`, which when merged should equal
 *   `podcastMetadataToSync`.
 */
function partitionMetadataBatches(
  cachedMetadata: Partial<Podcast>,
  podcastMetadataToSync: Partial<Podcast>,
) : Partial<Podcast>[] {
  const { episodes, ...mainMetadata } = { ...podcastMetadataToSync };
  if (!hasMetadata(episodes)) return [podcastMetadataToSync];

  const batches : Partial<Podcast>[] = [];
  const numBatches = Math.min(MAX_BATCHES, Math.ceil(episodes.length / MAX_EPISODES_PER_BATCH));
  let priorMetadata = cachedMetadata;

  for (let count = 1; count <= numBatches; count++) {
    // Episodes are sorted from new to old
    const batchEpisodes = count === 1 ? (episodes || []).slice(-MAX_EPISODES_PER_BATCH)
      : episodes.slice(-(MAX_EPISODES_PER_BATCH * count), -(MAX_EPISODES_PER_BATCH * (count - 1)));
    const currentBatch = {
      ...mainMetadata,
      episodes: batchEpisodes,
    };
    const previousBatch = batches.length ? batches[batches.length - 1] : {};
    const previousVsCurrentDiff = rightDiff(previousBatch, currentBatch, ['subscribeUrl', 'title']);
    priorMetadata = mergeBatchMetadata([priorMetadata, previousBatch], true);

    const firstEpisodeDate = getFirstEpisodeDate(currentBatch);
    const lastEpisodeDate = getLastEpisodeDate(currentBatch);
    const metadataBatch = getMetadataBatchNumber(priorMetadata, firstEpisodeDate, lastEpisodeDate);
    batches.push({
      ...previousVsCurrentDiff,
      firstEpisodeDate,
      lastEpisodeDate,
      metadataBatch,
    });
  }

  return batches.filter(batch => hasMetadata(batch));
}

export function formatNewMetadataToSync(
  allTxs: ArSyncTx[],
  prevMetadataToSync: Partial<Podcast>[] = [],
) : Partial<Podcast>[] {
  let diffs = prevMetadataToSync;
  allTxs.forEach(tx => {
    if (isPosted(tx) || isConfirmed(tx)) {
      const { subscribeUrl, metadata } = tx;
      const prevPodcastToSyncDiff = findMetadata(subscribeUrl, diffs);
      let newDiff : Partial<Podcast> = {};
      if (hasMetadata(prevPodcastToSyncDiff)) {
        newDiff = rightDiff(metadata, prevPodcastToSyncDiff, ['subscribeUrl', 'title']);
      }

      diffs = diffs.filter(oldDiff => oldDiff.subscribeUrl !== subscribeUrl);
      if (hasMetadata(newDiff)) diffs.push(newDiff);
    }
  });

  return diffs;
}
