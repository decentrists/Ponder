import React, {
  createContext, useState, useContext,
  useRef, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { SubscriptionsContext } from './subscriptions';
import {
  isNotEmpty, valuesEqual,
  concatMessages, episodesCount,
} from '../utils';
import { JWKInterface } from 'arweave/node/lib/wallet';
import * as arweave from '../client/arweave';
import * as arsync from '../client/arweave/sync';
import { TransactionStatusResponse } from 'arweave/node/transactions';

interface ArweaveContextType {
  isSyncing: boolean,
  wallet: JWKInterface | undefined,
  walletAddress: string,
  loadNewWallet: (newWallet?: JWKInterface) => Promise<void>,
  arSyncTxs: arsync.ArSyncTx[],
  prepareSync: () => Promise<void>,
  startSync: () => Promise<void>,
  removeArSyncTxs: (ids?: string[] | null) => void,
  hasPendingTxs: boolean,
}

export const ArweaveContext = createContext<ArweaveContextType>({
  isSyncing: false,
  wallet: undefined,
  walletAddress: '',
  loadNewWallet: async () => {},
  arSyncTxs: [],
  prepareSync: async () => {},
  startSync: async () => {},
  removeArSyncTxs: () => {},
  hasPendingTxs: false,
});

function readCachedArSyncTxs() {
  const cachedJson = localStorage.getItem('arSyncTxs');
  if (!cachedJson) return [];

  const arSyncTxsDto = JSON.parse(cachedJson);
  const arSyncTxsObject : arsync.ArSyncTx[] = arSyncTxsDto.map((tx: arsync.ArSyncTx) => ({
    ...tx,
    resultObj: ('errorMessage' in tx.resultObj ? tx.resultObj as unknown as Error :
      tx.resultObj as arsync.TransactionDTO),
  } as arsync.ArSyncTx));

  return arSyncTxsObject;
}

function writeCachedArSyncTxs(arSyncTxs: arsync.ArSyncTx[]) {
  // Skip txs that are in Initialized state
  const txsToCache = arSyncTxs.filter(tx => tx.status !== arsync.ArSyncTxStatus.INITIALIZED);
  const arSyncTxsDto : arsync.ArSyncTx[] = txsToCache.map((tx: arsync.ArSyncTx) => ({
    ...tx,
    metadata: {},
  }));

  localStorage.setItem('arSyncTxs', JSON.stringify(arSyncTxsDto));
}

// TODO: ArSync v1.5+, test me
const ArweaveProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refresh, metadataToSync, setMetadataToSync } = useContext(SubscriptionsContext);
  const toast = useContext(ToastContext);
  const [wallet, setWallet] = useState<JWKInterface>();
  const [walletAddress, setWalletAddress] = useState('');
  const loadingWallet = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  let cachedArSyncTxs : arsync.ArSyncTx[] = [];
  try {
    cachedArSyncTxs = readCachedArSyncTxs();
  }
  catch (ex) {
    console.error(`Error while reading the cached transactions: ${ex}.`);
    toast(`Error while reading the cached transactions: ${ex}.\nCached transactions have been ` +
          'cleared.', { autohideDelay: 0, variant: 'danger' });
  }
  const [arSyncTxs, setArSyncTxs] = useState<arsync.ArSyncTx[]>(cachedArSyncTxs);

  function hasPendingTxs() {
    return !!arsync.findInitializedTxs(arSyncTxs).length;
  }

  /**
   * Loads the state variables `wallet` and `walletAddress` for the given `newWallet`.
   * If !newWallet, a new developer wallet is created and some AR tokens are minted.
   * @param newWallet
   */
  const loadNewWallet = useCallback(async (newWallet?: JWKInterface) => {
    if (!loadingWallet.current) {
      loadingWallet.current = true;

      const userOrDevWallet = newWallet || await arweave.createNewDevWallet();
      if (!valuesEqual(wallet, userOrDevWallet)) {
        setWalletAddress(await arweave.getWalletAddress(userOrDevWallet));
        setWallet(userOrDevWallet);
      }

      loadingWallet.current = false;
    }
  }, [wallet]);

  useEffect(() => {
    loadNewWallet(wallet);
  }, [wallet, loadNewWallet]);

  async function prepareSync() {
    if (!wallet) throw new Error('wallet is undefined');
    if (isSyncing || hasPendingTxs()) return;

    confirmArSyncTxs(); // TODO: instead, use setInterval elsewhere

    setIsSyncing(true);

    const [newSubscriptions, newMetadataToSync] = await refresh(true, 600); // MVP: change to 30

    if (!isNotEmpty(newSubscriptions)) {
      return cancelSync('Failed to refresh subscriptions.');
    }
    if (!isNotEmpty(newMetadataToSync)) {
      return cancelSync('Subscribed podcasts are already up-to-date.', 'info');
    }

    let newTxs : arsync.ArSyncTx[];
    try {
      newTxs = await arsync.initArSyncTxs(newSubscriptions, newMetadataToSync, wallet);
    }
    catch (ex) {
      console.error(ex);
      return cancelSync(`Failed to sync with Arweave: ${ex}`);
    }

    const failedTxs = arsync.findErroredTxs(newTxs);
    if (!arsync.findInitializedTxs(newTxs).length) {
      if (!failedTxs.length) {
        return cancelSync('Subscribed podcasts are already up-to-date.', 'info');
      }
      // All transactions failed to create; probably due to invalid wallet or disconnectivity
      return cancelSync(`Failed to sync with Arweave: ${failedTxs[0].resultObj}`);
    }

    // TODO: pending T252, add txs to transaction cache
    // TODO: check that each txs.resultObj is a valid Arweave Transaction object
    setArSyncTxs(prev => prev.concat(newTxs));
    setIsSyncing(false);
  }

  async function cancelSync(toastMessage = '', variant = 'danger') {
    setIsSyncing(false);

    let firstMessage = toastMessage;
    if (firstMessage) {
      if (variant === 'danger') firstMessage += '\nPlease try to sync again.';
      toast(firstMessage, { variant });
    }
    if (hasPendingTxs()) {
      toast('Pending transactions have been cleared, but their data is still cached.',
        { variant: 'warning' });
      setArSyncTxs([]);
    }
  }

  async function startSync() {
    if (!wallet) throw new Error('wallet is undefined');
    if (!hasPendingTxs()) return cancelSync();

    setIsSyncing(true);

    const txsToSync = arsync.findInitializedTxs(arSyncTxs);
    const txsToSyncIds = txsToSync.map(tx => tx.id);
    let allTxs : arsync.ArSyncTx[];
    try {
      allTxs = await arsync.startSync(arSyncTxs, wallet);
    }
    catch (ex) {
      console.error(ex);
      return cancelSync(`Failed to sync with Arweave: ${ex}`);
    }

    const syncResultTxs = allTxs.filter(tx => txsToSyncIds.includes(tx.id));
    const postedTxs = arsync.findPostedTxs(syncResultTxs);
    const erroredTxs = arsync.findErroredTxs(syncResultTxs);
    const pluralize = (array: any[]) => array.length > 1 ? 's' : '';
    try {
      if (isNotEmpty(postedTxs)) {
        const message = concatMessages(postedTxs.map(elem =>
          `${elem.title} (${episodesCount(elem.metadata)} new episodes)`));
        toast(`${postedTxs.length} Transaction${pluralize(postedTxs)} successfully posted to ` +
          `Arweave with metadata for:\n${message}`, { autohideDelay: 10000, variant: 'success' });
      }
      if (isNotEmpty(erroredTxs)) {
        const message =
          concatMessages(erroredTxs.map(elem => `${elem.title}, reason:\n${elem.resultObj}\n`));
        toast(`${erroredTxs.length} Transaction${pluralize(erroredTxs)} failed to post to ` +
          `Arweave with metadata for:\n${message}`, { autohideDelay: 0, variant: 'danger' });
      }
      // TODO: atm, some fields like `firstEpisodeDate` are only updated upon another refresh.
      //       we could: either update subscriptions here,
      //       or update SubscriptionsProvider.readCachedPodcasts() to include
      //       arsync.findPostedTxs(arSyncTxs)
      setMetadataToSync(arsync.formatNewMetadataToSync(allTxs, metadataToSync));
    }
    catch (ex) {
      console.error(`An unexpected error occurred during synchronization with Arweave: ${ex}`);
    }
    finally {
      setArSyncTxs(allTxs);
      setIsSyncing(false);
    }
  }

  /**
   * Determines the transaction status of the posted `arSyncTxs` and updates the confirmed ones.
   */
  async function confirmArSyncTxs() {
    if (isSyncing) return;

    console.debug('Refreshing transaction status');
    const postedTxs = arsync.findPostedTxs(arSyncTxs);
    const newArSyncTxs : arsync.ArSyncTx[] = [...arSyncTxs];
    let updated = false;

    await Promise.all(postedTxs.map(async tx => {
      const status : TransactionStatusResponse =
        await arweave.getTxConfirmationStatus(tx.resultObj as arsync.TransactionDTO);

      // TODO: adjust for mainnet https://github.com/ArweaveTeam/arweave-js#get-a-transaction-status
      //       * change `status.confirmed` to `isNotEmpty(status.confirmed)`
      //       * test status.confirmed.number_of_confirmations
      if (status.status === 200 && status.confirmed) {
        const index = newArSyncTxs.findIndex(item => item.id === tx.id);
        if (index > -1) {
          updated = true;
          newArSyncTxs[index] = {
            ...tx,
            status: arsync.ArSyncTxStatus.CONFIRMED,
          };
        }
      }
      // TODO: set status to REJECTED if now - tx.timestamp > 1 hour
    }));

    if (updated) {
      console.debug('At least one posted transaction has been confirmed.');
      setArSyncTxs(newArSyncTxs);
    }
  }

  /**
   * Removes elements matching `ids` from `arSyncTxs`.
   * Clears all `arSyncTxs` if `ids` is null.
   * @param ids
   */
  function removeArSyncTxs(ids: string[] | null = null) {
    if (ids === null) setArSyncTxs([]);
    else {
      const newValue : arsync.ArSyncTx[] = arSyncTxs.filter(tx => !ids.includes(tx.id));
      setArSyncTxs(newValue);
    }
  }

  useRerenderEffect(() => {
    console.debug('arSyncTxs has been updated to:', arSyncTxs);

    // TODO: warn upon leaving page if there are pending Initialized arSyncTxs

    try {
      writeCachedArSyncTxs(arSyncTxs);
    }
    catch (ex) {
      console.error(`Error while saving the transactions to LocalStorage: ${ex}.`);
      toast(`Error while saving the transactions to LocalStorage: ${ex}.`,
        { autohideDelay: 0, variant: 'danger' });
    }
  }, [arSyncTxs]);

  return (
    <ArweaveContext.Provider
      value={{
        isSyncing,
        wallet,
        walletAddress,
        loadNewWallet,
        arSyncTxs,
        prepareSync,
        startSync,
        removeArSyncTxs,
        hasPendingTxs: hasPendingTxs(),
      }}
    >
      {children}
    </ArweaveContext.Provider>
  );
};

ArweaveProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ArweaveProvider;
