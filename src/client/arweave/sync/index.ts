import { v4 as uuid } from 'uuid';
import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { Podcast } from '../../interfaces';
import {
  episodesCount,
  findMetadata,
  getFirstEpisodeDate,
  getLastEpisodeDate,
  hasMetadata,
} from '../../../utils';
import { getMetadataBatchNumber } from '../create-transaction';
import { mergeBatchMetadata, rightDiff } from './diff-merge-logic';
import * as arweave from '..';

export enum ArSyncTxStatus {
  ERRORED,
  INITIALIZED,
  POSTED,
  CONFIRMED,
  REJECTED, // If tx confirmation fails
}

export interface TransactionDTO extends Transaction {}

export interface ArSyncTx {
  id: string, // uuid, not to be confused with `(resultObj as Transaction).id`
  subscribeUrl: string, // TODO: pending T244, change to 'podcastId'
  title?: string,
  resultObj: Transaction | TransactionDTO | Error,
  metadata: Partial<Podcast>,
  numEpisodes: number,
  status: ArSyncTxStatus,
  // TODO: add `timestamp`
}

/** To reduce the size per transaction */
const MAX_EPISODES_PER_BATCH = 50;
/** Fail-safe through which we sync max 1000 episodes per podcast */
const MAX_BATCHES = 20;

/** Helper function in order to retain numeric ArSyncTxStatus enums */
export const statusToString = (status: ArSyncTxStatus) => {
  switch (status) {
    case ArSyncTxStatus.ERRORED:
      return 'Error';
    case ArSyncTxStatus.INITIALIZED:
      return 'Initialized';
    case ArSyncTxStatus.POSTED:
      return 'Posted';
    case ArSyncTxStatus.CONFIRMED:
      return 'Confirmed';
    case ArSyncTxStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Unknown';
  }
};

export const isErrored = (tx: ArSyncTx) => tx.status === ArSyncTxStatus.ERRORED;
export const isNotErrored = (tx: ArSyncTx) => tx.status !== ArSyncTxStatus.ERRORED;
export const isInitialized = (tx: ArSyncTx) => tx.status === ArSyncTxStatus.INITIALIZED;
export const isNotInitialized = (tx: ArSyncTx) => tx.status !== ArSyncTxStatus.INITIALIZED;
export const isPosted = (tx: ArSyncTx) => tx.status === ArSyncTxStatus.POSTED;
export const isNotPosted = (tx: ArSyncTx) => tx.status !== ArSyncTxStatus.POSTED;
export const isConfirmed = (tx: ArSyncTx) => tx.status === ArSyncTxStatus.CONFIRMED;
export const isNotConfirmed = (tx: ArSyncTx) => tx.status !== ArSyncTxStatus.CONFIRMED;

export async function initArSyncTxs(
  subscriptions: Podcast[], metadataToSync: Partial<Podcast>[], wallet: JWKInterface)
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
        newTxResult = await arweave.newMetadataTransaction(wallet, podcastToSync, cachedMetadata);
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

export async function startSync(allTxs: ArSyncTx[], wallet: JWKInterface) : Promise<ArSyncTx[]> {
  const result : ArSyncTx[] = [...allTxs];
  await Promise.all(allTxs.map(async (tx, index) => {
    if (isInitialized(tx)) {
      let postedTxResult : Transaction | Error;
      try {
        postedTxResult =
          await arweave.signAndPostTransaction(tx.resultObj as Transaction, wallet);
      }
      catch (ex) {
        postedTxResult = ex as Error;
      }
      const arSyncTx : ArSyncTx = {
        ...tx,
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
  cachedMetadata: Partial<Podcast>, podcastMetadataToSync: Partial<Podcast>) : Partial<Podcast>[] {

  const { episodes, ...mainMetadata } = { ...podcastMetadataToSync };
  if (!hasMetadata(episodes)) return [podcastMetadataToSync];

  const batches : Partial<Podcast>[] = [];
  const numBatches = Math.min(MAX_BATCHES, Math.ceil(episodes.length / MAX_EPISODES_PER_BATCH));
  let priorMetadata = cachedMetadata;

  for (let count = 1; count <= numBatches; count++) {
    // Episodes are sorted from new to old
    const batchEpisodes = count === 1 ? (episodes || []).slice(-MAX_EPISODES_PER_BATCH) :
      episodes.slice(-(MAX_EPISODES_PER_BATCH * count), -(MAX_EPISODES_PER_BATCH * (count - 1)));
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
  allTxs: ArSyncTx[], prevMetadataToSync: Partial<Podcast>[] = []) : Partial<Podcast>[] {

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
