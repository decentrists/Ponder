import { v4 as uuid } from 'uuid';
import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { DispatchResult } from 'arconnect';
import {
  ArSyncTx,
  ArSyncTxStatus,
  ArweaveTag,
  Episode,
  Podcast,
} from '../../interfaces';
import {
  findMetadata,
  getFirstEpisodeDate,
  getLastEpisodeDate,
  hasMetadata,
} from '../../../utils';
import { formatTags, getMetadataBatchNumber } from '../create-transaction';
import { mergeBatchMetadata, rightDiff } from './diff-merge-logic';
import { WalletDeferredToArConnect } from '../wallet';
import {
  calculateTagsSize,
  compressMetadata,
  isConfirmed,
  isInitialized,
  isPosted,
  usingArConnect,
} from '../utils';
import {
  newTransactionFromCompressedMetadata,
  dispatchTransaction,
  signAndPostTransaction,
} from '..';

interface PartitionedBatch extends Pick<ArSyncTx, 'subscribeUrl' | 'title' | 'metadata'
| 'numEpisodes'> {
  compressedMetadata: Uint8Array;
  tags: ArweaveTag[];
}

/** Max size of compressed metadata per transaction (including tags) */
const MAX_BATCH_SIZE = 96 * 1024; // KiloBytes

export async function initArSyncTxs(
  subscriptions: Podcast[],
  metadataToSync: Partial<Podcast>[],
  wallet: JWKInterface | WalletDeferredToArConnect,
)
  : Promise<ArSyncTx[]> {
  const result : ArSyncTx[] = [];
  const partitionedBatches : PartitionedBatch[] = [];

  metadataToSync.forEach(podcastMetadataToSync => {
    let cachedMetadata : Partial<Podcast> = {};
    if (hasMetadata(podcastMetadataToSync)) {
      let subscribeUrl! : string;
      try {
        subscribeUrl = podcastMetadataToSync.subscribeUrl!;
        cachedMetadata = findMetadata(subscribeUrl, subscriptions);

        // A transaction will be created for each batchesToSync[i]
        const batchesToSync = partitionMetadataBatches(cachedMetadata, podcastMetadataToSync);
        partitionedBatches.push(...batchesToSync);
      }
      catch (ex) {
        console.error(`Failed to sync ${subscribeUrl} due to: ${ex}`);
      }
    }
  });

  await Promise.all(partitionedBatches.map(async batch => {
    let subscribeUrl! : string;
    let newTxResult : Transaction | Error;
    try {
      subscribeUrl = batch.subscribeUrl;
      newTxResult = await newTransactionFromCompressedMetadata(
        wallet, batch.compressedMetadata, batch.tags,
      );
    }
    catch (ex) {
      newTxResult = ex as Error;
    }
    const arSyncTx : ArSyncTx = {
      id: uuid(),
      subscribeUrl,
      title: batch.title,
      resultObj: newTxResult,
      metadata: batch.metadata,
      numEpisodes: batch.numEpisodes,
      status: newTxResult instanceof Error ? ArSyncTxStatus.ERRORED : ArSyncTxStatus.INITIALIZED,
    };
    result.push(arSyncTx);
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
 * Runs several passes of gzip compression of a subset of `episodesToSync` (consecutive, starting
 * with the oldest episode at `episodesToSync[-1]`), in an attempt to find the best possible single
 * metadata batch that fits within `MAX_BATCH_SIZE`.
 * @param cachedMetadata
 * @param podcastMetadataToSync
 * @param episodesToSync
 * @returns The next metadata batch comprising a subset of `episodesToSync` that, using gzip
 *   compression, best fits within MAX_BATCH_SIZE.
 */
const findNextOptimalBatch = (
  cachedMetadata: Partial<Podcast>,
  podcastMetadataToSync: Partial<Podcast>,
  episodesToSync: Episode[],
) : PartitionedBatch => {
  const result : PartitionedBatch = {
    subscribeUrl: podcastMetadataToSync.subscribeUrl || cachedMetadata.subscribeUrl || '',
    title: podcastMetadataToSync.title || cachedMetadata.title || '',
    numEpisodes: 0,
    metadata: podcastMetadataToSync,
    compressedMetadata: new Uint8Array([]),
    tags: [],
  };
  let numEps = Math.min(episodesToSync.length, 100);
  let gzip : Uint8Array;
  let minEps = 1;
  let maxEps = Infinity;
  let bestResultMargin = Infinity;

  if (!hasMetadata(episodesToSync)) return result;

  for (let pass = 1; pass <= 10; pass++) {
    console.debug('pass', pass); // TODO: left in for (acceptance) testing
    console.debug(`numEps=${numEps}, minEps=${minEps}, maxEps=${maxEps}`);

    const currentBatch = {
      ...podcastMetadataToSync,
      episodes: (episodesToSync || []).slice(-numEps),
    };
    const tags = formatTags(currentBatch, cachedMetadata);
    const tagsSize = calculateTagsSize(tags);
    gzip = compressMetadata(currentBatch);

    const relativeBatchSize = (tagsSize + gzip.byteLength) / MAX_BATCH_SIZE;
    const resultMargin = Math.abs(0.8 - relativeBatchSize);
    if (resultMargin < bestResultMargin) {
      // Best intermediate result is the one closest to relativeBatchSize=0.8
      bestResultMargin = resultMargin;
      result.numEpisodes = numEps;
      result.compressedMetadata = gzip;
      result.metadata = currentBatch;
      result.tags = tags;
    }
    console.debug('batchSize', tagsSize + gzip.byteLength);
    console.debug('relativeBatchSize', relativeBatchSize);

    if (relativeBatchSize > 1) {
      // Too large
      maxEps = Math.min(maxEps, numEps);
      // For the next pass, set numEps to the average of: (a predictive numEps based on
      // relativeBatchSize) + (the smallest oversized numEps), adding a lower bias with each pass.
      numEps = Math.min(episodesToSync.length,
        Math.floor((1 - 0.05 * pass) * (((numEps / relativeBatchSize) + maxEps) / 2)));
    }
    else if (relativeBatchSize < 0.8) {
      // Too small, but acceptable
      if (numEps >= episodesToSync.length) break;

      minEps = Math.max(minEps, numEps);
      numEps = Math.min(episodesToSync.length,
        Math.floor((1 + 0.05 * pass) * (((numEps / relativeBatchSize) + minEps) / 2)));
    }
    else {
      // Good result
      break;
    }
    if (numEps < minEps || numEps > maxEps) {
      // Optimal result has been found already
      break;
    }
  }
  console.debug('returned result', result);
  return result;
};

/**
 * @param cachedMetadata
 * @param podcastMetadataToSync
 * @returns An array of partitioned `podcastMetadataToSync`, which when merged should equal
 *   `podcastMetadataToSync`. Ensures each batch size in bytes <= `MAX_BATCH_SIZE`.
 */
function partitionMetadataBatches(
  cachedMetadata: Partial<Podcast>,
  podcastMetadataToSync: Partial<Podcast>,
) : PartitionedBatch[] {
  const batches : PartitionedBatch[] = [];
  const { episodes, ...mainMetadata } = { ...podcastMetadataToSync };

  let precedingMetadata = {};
  let previousBatchMetadata = {};
  let episodesRemainder = episodes || [];
  do {
    // TODO: 2nd parameter should be akin to precedingVsCurrentDiff;
    //       currently, batch.compressedMetadata and batch.tags are unoptimized versions
    const currentBatch = findNextOptimalBatch(cachedMetadata, mainMetadata, episodesRemainder);

    precedingMetadata = mergeBatchMetadata([precedingMetadata, previousBatchMetadata], true);
    const precedingVsCurrentDiff = rightDiff(
      precedingMetadata, currentBatch.metadata, ['subscribeUrl', 'title'],
    );

    if (episodesRemainder.length) {
      const firstEpisodeDate = getFirstEpisodeDate(currentBatch.metadata);
      const lastEpisodeDate = getLastEpisodeDate(currentBatch.metadata);
      const metadataBatch = getMetadataBatchNumber(
        precedingMetadata, firstEpisodeDate, lastEpisodeDate,
      );
      currentBatch.metadata = {
        ...precedingVsCurrentDiff,
        firstEpisodeDate,
        lastEpisodeDate,
        metadataBatch,
      };
    }
    else currentBatch.metadata = precedingVsCurrentDiff;
    batches.push(currentBatch);
    previousBatchMetadata = currentBatch.metadata;

    const newEpisodesRemainder = episodesRemainder.slice(0, -currentBatch.numEpisodes);
    if (newEpisodesRemainder.length >= episodesRemainder.length) break; // fail-safe
    episodesRemainder = newEpisodesRemainder;
  }
  while (episodesRemainder.length);

  return batches.filter(batch => hasMetadata(batch.metadata));
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
