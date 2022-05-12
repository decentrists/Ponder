import Transaction from 'arweave/node/lib/transaction';
import { JWKInterface } from 'arweave/node/lib/wallet';
import * as arweave from '..';
import { Podcast } from '../../interfaces';
import { findMetadata, hasMetadata } from '../../../utils';

export interface TransactionStatus<T> {
  subscribeUrl: string,
  title?: string,
  resultObj: T,
  metadata: Podcast,
}

export async function initArSyncTxs(subscriptions: Podcast[],
  metadataToSync: Partial<Podcast>[], wallet: JWKInterface) {
  const txs : TransactionStatus<Transaction>[] = [];
  const failedTxs : TransactionStatus<Error>[] = [];

  await Promise.all(metadataToSync.map(async podcastToSync => {
    if (hasMetadata(podcastToSync)) {
      const { subscribeUrl } = podcastToSync;
      const cachedMetadata = findMetadata(subscribeUrl!, subscriptions);
      let newTxResult : Transaction | Error;
      try {
        newTxResult = await arweave.newMetadataTransaction(wallet, podcastToSync, cachedMetadata);
      }
      catch (ex) {
        newTxResult = ex as Error;
      }
      const status = {
        subscribeUrl,
        title: cachedMetadata?.title,
        resultObj: newTxResult,
        metadata: podcastToSync,
      };
      status.resultObj instanceof Error ? failedTxs.push(status as TransactionStatus<Error>) 
        : txs.push(status as TransactionStatus<Transaction>);
    }
  }));
  console.debug('initArSyncTxs txs=', txs);
  console.debug('initArSyncTxs failedTxs=', failedTxs);

  return { txs, failedTxs };
}

export async function startSync(pendingTxs: TransactionStatus<Transaction>[],
  wallet: JWKInterface) {
  const txs : TransactionStatus<Transaction>[] = [];
  const failedTxs : TransactionStatus<Error>[] = [];

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
    postedTxResult instanceof Error ? failedTxs.push(status as TransactionStatus<Error>) 
      : txs.push(status as TransactionStatus<Transaction>);
  }));
  console.debug('startSync txs=', txs);
  console.debug('startSync failedTxs=', failedTxs);

  return { txs, failedTxs };
}

export function formatNewMetadataToSync(failedTxs: TransactionStatus<Error>[]) {
  return failedTxs.map(elem => elem.metadata);
}
