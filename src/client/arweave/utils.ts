import { isNotEmpty } from '../../utils';
import {
  ArSyncTx,
  ArSyncTxStatus,
  DispatchResultDTO,
  TransactionDTO,
} from '../interfaces';

const PLURAL_TAG_MAP = {
  category: 'categories',
  keyword: 'keywords',
  episodesKeyword: 'episodesKeywords',
};
const TAG_EXCLUDE_PREFIX = ['App-Name', 'App-Version', 'Content-Type', 'Unix-Time'];

// TODO: Move this check up the CI/CD pipeline
// function sanityCheckedTag() {
//   const tag = process.env.REACT_APP_TAG_PREFIX;
//   if (!tag || tag === 'undefined' || tag === 'null') {
//    throw new Error('process.env.REACT_APP_TAG_PREFIX is not set up.
//    Please contact our development team.');
//   }
//   return tag;
// }

export function toTag(name: string) {
  return TAG_EXCLUDE_PREFIX.includes(name) ? name : `${process.env.REACT_APP_TAG_PREFIX}-${name}`;
}

export function fromTag(tagName: string) {
  const a = tagName.replace(new RegExp(`^${process.env.REACT_APP_TAG_PREFIX}-`), '');
  return PLURAL_TAG_MAP[a as keyof typeof PLURAL_TAG_MAP] || a;
}

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
export const isBundled = (tx: ArSyncTx) => isNotEmpty(tx.dispatchResult)
  && tx.dispatchResult.type === 'BUNDLED';

/**
 * @param oldArSyncTxs
 * @param updatedArSyncTxs Assumed to be a subset of `oldArSyncTxs`
 * @returns The `oldArSyncTxs` where each of the `updatedArSyncTxs` is updated in-place.
 */
export const mergeArSyncTxs = (oldArSyncTxs: ArSyncTx[], updatedArSyncTxs: ArSyncTx[])
: ArSyncTx[] => oldArSyncTxs.map(oldElem => updatedArSyncTxs.find(newElem => newElem.id
  === oldElem.id) || oldElem);

/**
 * @returns The id of the Arweave Transaction associated with the given ArSyncTx object;
 *   returns an empty string if not found.
 */
export const getTxId = (tx: ArSyncTx) : string => (isBundled(tx) ? tx.dispatchResult!.id
  : (tx.resultObj as TransactionDTO).id) || '';

/**
 * @returns The id of the parent ArBundle Arweave Transaction enclosing the ArBundled Transaction
 *   associated with the given ArSyncTx object; returns an empty string if not found.
 */
export const getBundleTxId = (tx: ArSyncTx) : string => (isNotEmpty(tx.dispatchResult)
  ? (tx.dispatchResult as DispatchResultDTO).bundledIn : '') || '';

/** Defaults to true, if process.env.REACT_APP_USE_ARCONNECT != false */
export function usingArConnect() : boolean {
  if (usingArLocal()) return false;
  return (process.env.REACT_APP_USE_ARCONNECT as string) !== 'false';
}

/** Defaults to false, if process.env.REACT_APP_USE_ARLOCAL != true */
export function usingArLocal() : boolean {
  return (process.env.REACT_APP_USE_ARLOCAL as string) === 'true';
}
