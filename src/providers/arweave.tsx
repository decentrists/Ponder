import React, {
  createContext, useState, useContext,
  useRef, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { DBStatus, SubscriptionsContext } from './subscriptions';
import {
  isNotEmpty,
  valuesEqual,
  concatMessages,
} from '../utils';
import { JWKInterface } from 'arweave/node/lib/wallet';
import * as arweave from '../client/arweave';
import * as arsync from '../client/arweave/sync';
import { TransactionStatusResponse } from 'arweave/node/transactions';

// Convenience aliases
interface ArSyncTx extends arsync.ArSyncTx {}
const isErrored = arsync.isErrored;
const isInitialized = arsync.isInitialized;
const isNotInitialized = arsync.isNotInitialized;
const isPosted = arsync.isPosted;

interface ArweaveContextType {
  isSyncing: boolean,
  wallet: JWKInterface | undefined,
  walletAddress: string,
  loadNewWallet: (newWallet?: JWKInterface) => Promise<void>,
  arSyncTxs: ArSyncTx[],
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

const TX_CONFIRMATION_INTERVAL = 30000; // ms

// TODO: ArSync v1.5+, test me
const ArweaveProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isRefreshing, refresh,
    metadataToSync, setMetadataToSync,
    readCachedArSyncTxs, writeCachedArSyncTxs,
    dbStatus, setDbStatus,
  } = useContext(SubscriptionsContext);
  const toast = useContext(ToastContext);
  const [wallet, setWallet] = useState<JWKInterface>();
  const [walletAddress, setWalletAddress] = useState('');
  const loadingWallet = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [arSyncTxs, setArSyncTxs] = useState<ArSyncTx[]>([]);

  function hasPendingTxs() {
    return arSyncTxs.some(isInitialized);
  }

  async function prepareSync() {
    if (!wallet) return cancelSync('Wallet is undefined');
    if (isSyncing || isRefreshing || hasPendingTxs()) return;

    setIsSyncing(true);

    const [newSubscriptions, newMetadataToSync] = await refresh(null, true, 600); // MVP: set to 30

    if (!isNotEmpty(newSubscriptions)) {
      return cancelSync('Failed to refresh subscriptions.');
    }
    if (!isNotEmpty(newMetadataToSync)) {
      return cancelSync('Subscribed podcasts are already up-to-date.', 'info');
    }

    let newTxs : ArSyncTx[];
    try {
      newTxs = await arsync.initArSyncTxs(newSubscriptions, newMetadataToSync, wallet);
    }
    catch (ex) {
      console.error(ex);
      return cancelSync(`Failed to sync with Arweave: ${ex}`);
    }

    const failedTxs = newTxs.filter(isErrored);
    if (!newTxs.some(isInitialized)) {
      if (!failedTxs.length) {
        return cancelSync('Subscribed podcasts are already up-to-date.', 'info');
      }
      // All transactions failed to create; probably due to invalid wallet or disconnectivity
      return cancelSync(`Failed to sync with Arweave: ${failedTxs[0].resultObj}`);
    }

    // TODO: pending T252, add txs to transaction cache
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
      setArSyncTxs(arSyncTxs.filter(isNotInitialized));
    }
  }

  async function startSync() {
    if (!wallet) throw new Error('wallet is undefined');
    if (!hasPendingTxs()) return cancelSync();

    setIsSyncing(true);

    const txsToSync = arSyncTxs.filter(isInitialized);
    const txsToSyncIds = txsToSync.map(tx => tx.id);
    let allTxs : ArSyncTx[];
    try {
      allTxs = await arsync.startSync(arSyncTxs, wallet);
    }
    catch (ex) {
      console.error(ex);
      return cancelSync(`Failed to sync with Arweave: ${ex}`);
    }

    const syncResultTxs = allTxs.filter(tx => txsToSyncIds.includes(tx.id));
    const postedTxs = syncResultTxs.filter(isPosted);
    const erroredTxs = syncResultTxs.filter(isErrored);
    const pluralize = (array: any[]) => array.length > 1 ? 's' : '';
    try {
      if (isNotEmpty(postedTxs)) {
        const message = concatMessages(postedTxs.map(elem =>
          `${elem.title} (${elem.numEpisodes} new episodes)`));
        toast(`${postedTxs.length} Transaction${pluralize(postedTxs)} successfully posted to ` +
          `Arweave with metadata for:\n${message}`, { autohideDelay: 10000, variant: 'success' });
      }
      if (isNotEmpty(erroredTxs)) {
        const message =
          concatMessages(erroredTxs.map(elem => `${elem.title}, reason:\n${elem.resultObj}\n`));
        toast(`${erroredTxs.length} Transaction${pluralize(erroredTxs)} failed to post to ` +
          `Arweave with metadata for:\n${message}`, { autohideDelay: 0, variant: 'danger' });
      }
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
   * Removes elements matching `ids` from `arSyncTxs`.
   * Clears all `arSyncTxs` if `ids` is null.
   * @param ids
   */
  function removeArSyncTxs(ids: string[] | null = null) {
    if (ids === null) setArSyncTxs([]);
    else {
      const newValue : ArSyncTx[] = arSyncTxs.filter(tx => !ids.includes(tx.id));
      setArSyncTxs(newValue);
    }
  }

  /**
   * Determines the transaction status of the posted `arSyncTxs` and updates the confirmed ones.
   */
  const confirmArSyncTxs = useCallback(async () => {
    if (isSyncing || isRefreshing) return;

    console.debug('Refreshing transaction status');

    const newArSyncTxs : ArSyncTx[] = [...arSyncTxs];
    const confirmedTxs : ArSyncTx[] = [];

    await Promise.all(arSyncTxs.filter(isPosted).map(async postedTx => {
      const status : TransactionStatusResponse =
        await arweave.getTxConfirmationStatus(postedTx.resultObj as arsync.TransactionDTO);

      // TODO: adjust for mainnet https://github.com/ArweaveTeam/arweave-js#get-a-transaction-status
      //       * change `status.confirmed` to `isNotEmpty(status.confirmed)`
      //       * test status.confirmed.number_of_confirmations
      if (status.status === 200 && status.confirmed) {
        const index = newArSyncTxs.findIndex(item => item.id === postedTx.id);
        if (index > -1) {
          newArSyncTxs[index] = {
            ...postedTx,
            status: arsync.ArSyncTxStatus.CONFIRMED,
          };
          confirmedTxs.push(newArSyncTxs[index]);
        }
      }
      // TODO: set status to REJECTED if !confirmed && (now - tx.timestamp) > 1 hour
    }));

    if (confirmedTxs.length) {
      console.debug('At least one posted transaction has been confirmed.');
      setArSyncTxs(newArSyncTxs);
      const confirmedPodcastIds = new Set<string>(confirmedTxs.map(tx => tx.subscribeUrl));
      await refresh([...confirmedPodcastIds], true, 0);
    }
  }, [isSyncing, isRefreshing, arSyncTxs, refresh]);

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

  useEffect(() => {
    const id = setInterval(confirmArSyncTxs, TX_CONFIRMATION_INTERVAL);
    return () => clearInterval(id);
  }, [confirmArSyncTxs]);

  useEffect(() => {
    const initializeArSyncTxs = async () => {
      try {
        let fetchedData : ArSyncTx[] = await readCachedArSyncTxs();
        fetchedData ||= [];

        const arSyncTxsObject : ArSyncTx[] = fetchedData.map((tx: ArSyncTx) => ({
          ...tx,
          resultObj: ('errorMessage' in tx.resultObj ? tx.resultObj as unknown as Error :
            tx.resultObj as arsync.TransactionDTO),
        } as ArSyncTx));

        setArSyncTxs(arSyncTxsObject);
      }
      catch (ex) {
        const errorMessage = `Error while reading the cached transactions: ${ex}.\n` +
                             'Cached transactions have been cleared.';
        console.error(errorMessage);
        toast(errorMessage, { autohideDelay: 0, variant: 'danger' });
      }
      finally {
        setDbStatus(DBStatus.INITIALIZED);
      }
    };

    if (dbStatus === DBStatus.INITIALIZING3) initializeArSyncTxs();
  }, [dbStatus, readCachedArSyncTxs, setDbStatus, toast]);

  useRerenderEffect(() => {
    const updateCachedArSyncTxs = async () => {
      try {
        const txsToCache = arSyncTxs.filter(isNotInitialized);
        const arSyncTxsDto : ArSyncTx[] = txsToCache.map((tx: ArSyncTx) => ({
          ...tx,
          metadata: {},
        }));
        await writeCachedArSyncTxs(arSyncTxsDto);
      }
      catch (ex) {
        const errorMessage = `Error while saving the transactions to IndexedDB: ${ex}.`;
        console.error(errorMessage);
        toast(errorMessage, { autohideDelay: 0, variant: 'danger' });
      }
    };

    // TODO: warn upon leaving page if there are pending Initialized arSyncTxs, as these aren't
    //   cached (and should not be cached since recreating them costs nothing and avoids timeouts).

    console.debug('arSyncTxs has been updated to:', arSyncTxs);
    if (dbStatus === DBStatus.INITIALIZED) updateCachedArSyncTxs();
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
