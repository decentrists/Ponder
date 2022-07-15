import React, {
  createContext, useState, useContext,
  useRef, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { TransactionStatusResponse } from 'arweave/node/transactions';
import { ApiConfig } from 'arweave/node/lib/api';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AppInfo, GatewayConfig, PermissionType } from 'arconnect';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { DBStatus, SubscriptionsContext } from './subscriptions';
import {
  isNotEmpty,
  valuesEqual,
  concatMessages,
} from '../utils';
import {
  isErrored,
  isInitialized,
  isNotInitialized,
  isPosted,
  mergeArSyncTxs,
  usingArConnect,
  usingArLocal,
} from '../client/arweave/utils';
import { WalletDeferredToArConnect } from '../client/arweave/wallet';
import client from '../client/arweave/client';
import {
  ArSyncTx,
  ArSyncTxStatus,
  DispatchResultDTO,
  TransactionDTO,
} from '../client/interfaces';
import * as arweave from '../client/arweave';
import * as arsync from '../client/arweave/sync';

interface ArweaveContextType {
  isSyncing: boolean,
  wallet: JWKInterface | WalletDeferredToArConnect,
  walletAddress: string,
  loadNewWallet: (loadedWallet: JWKInterface | WalletDeferredToArConnect,
    newWalletAddress: string | undefined) => Promise<void>,
  arSyncTxs: ArSyncTx[],
  prepareSync: () => Promise<void>,
  startSync: () => Promise<void>,
  removeArSyncTxs: (ids: string[] | null) => void,
  hasPendingTxs: boolean,
}

export const ArweaveContext = createContext<ArweaveContextType>({
  isSyncing: false,
  wallet: {},
  walletAddress: '',
  loadNewWallet: async () => {},
  arSyncTxs: [],
  prepareSync: async () => {},
  startSync: async () => {},
  removeArSyncTxs: () => {},
  hasPendingTxs: false,
});

/**
 * Start of ArConnect config params @see https://github.com/th8ta/ArConnect#permissions
 */
const ARCONNECT_PERMISSIONS : PermissionType[] = [
  'ACCESS_ADDRESS',
  'ACCESS_ALL_ADDRESSES', // Required for wallet switching
  // 'ACCESS_ARWEAVE_CONFIG', // TODO: prefer this over clientApiConfig under ARCONNECT_GATEWAY
  'ACCESS_PUBLIC_KEY',
  // 'DECRYPT',
  'DISPATCH',
  // 'ENCRYPT',
  // 'SIGNATURE',
  'SIGN_TRANSACTION', // TODO: request this permission when needed
];
const ARCONNECT_APPINFO : AppInfo = {
  name: `Ponder ${process.env.REACT_APP_VERSION}`,
  // logo: '', TODO
};
const clientApiConfig : ApiConfig = client.getConfig().api;
const ARCONNECT_GATEWAY : GatewayConfig | undefined = clientApiConfig.host && clientApiConfig.port
  && clientApiConfig.protocol ? {
    host: clientApiConfig.host,
    port: +clientApiConfig.port,
    protocol: clientApiConfig.protocol === 'http' ? 'http' : 'https',
  } : undefined; // These are optional

const TX_CONFIRMATION_INTERVAL = 30 * 1000;

// TODO: ArSync v1.5+, test me
const ArweaveProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isRefreshing, refresh,
    metadataToSync, setMetadataToSync,
    readCachedArSyncTxs, writeCachedArSyncTxs,
    dbStatus, setDbStatus,
  } = useContext(SubscriptionsContext);
  const toast = useContext(ToastContext);
  const [wallet, setWallet] = useState<JWKInterface | WalletDeferredToArConnect>({});
  const [walletAddress, setWalletAddress] = useState('');
  const loadingWallet = useRef(false);
  const eventListenersLoaded = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [arSyncTxs, setArSyncTxs] = useState<ArSyncTx[]>([]);

  function hasPendingTxs() {
    return arSyncTxs.some(isInitialized);
  }

  async function prepareSync() {
    if (!isNotEmpty(wallet) && !usingArConnect()) return cancelSync('Wallet is undefined');
    if (isSyncing || isRefreshing || hasPendingTxs()) return;

    setIsSyncing(true);

    const [newSubscriptions, newMetadataToSync] = await refresh(null, true, 600); // TODO MVP: => 30

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
    if (!isNotEmpty(wallet) && !usingArConnect()) throw new Error('wallet is undefined');
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
    const pluralize = (array: any[]) => (array.length > 1 ? 's' : '');
    try {
      if (isNotEmpty(postedTxs)) {
        const message = concatMessages(postedTxs
          .map(elem => `${elem.title} (${elem.numEpisodes} new episodes)`));
        toast(`${postedTxs.length} Transaction${pluralize(postedTxs)} successfully posted to `
          + `Arweave with metadata for:\n${message}`, { autohideDelay: 10000, variant: 'success' });
      }
      if (isNotEmpty(erroredTxs)) {
        const message = concatMessages(erroredTxs
          .map(elem => `${elem.title}, reason:\n${elem.resultObj}\n`));
        toast(`${erroredTxs.length} Transaction${pluralize(erroredTxs)} failed to post to `
          + `Arweave with metadata for:\n${message}`, { autohideDelay: 0, variant: 'danger' });
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
   * Removes elements matching `ids` from the `arSyncTxs` state.
   * Clears all `arSyncTxs` if `ids` is null.
   * @param ids
   */
  function removeArSyncTxs(ids: string[] | null) {
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

    const confirmedArSyncTxs : ArSyncTx[] = [];
    const updatedArSyncTxs : ArSyncTx[] = await arweave.updateArBundledParentIds(arSyncTxs);
    const newArSyncTxs : ArSyncTx[] = mergeArSyncTxs(arSyncTxs, updatedArSyncTxs);

    await Promise.all(newArSyncTxs.filter(isPosted).map(async postedTx => {
      const status : TransactionStatusResponse = await arweave.getTxConfirmationStatus(postedTx);

      if (status.status === 200 && status.confirmed) {
        if (usingArLocal() || status.confirmed.number_of_confirmations >= 1) {
          confirmedArSyncTxs.push({ ...postedTx, status: ArSyncTxStatus.CONFIRMED });
        }
      }
      // TODO: set status to REJECTED if !confirmed && (now - tx.timestamp) > 1 hour
    }));

    if (confirmedArSyncTxs.length || updatedArSyncTxs.length) {
      setArSyncTxs(mergeArSyncTxs(newArSyncTxs, confirmedArSyncTxs));
    }
    if (confirmedArSyncTxs.length) {
      console.debug('At least one posted transaction has been confirmed.');
      const confirmedPodcastIds = new Set<string>(confirmedArSyncTxs.map(tx => tx.subscribeUrl));
      await refresh([...confirmedPodcastIds], true, 0);
    }
  }, [isSyncing, isRefreshing, arSyncTxs, refresh]);

  /**
   * Loads the state variables `wallet` and `walletAddress` for the given `loadedWallet`.
   * If `loadedWallet` is empty, a new developer wallet is created and some AR tokens are minted.
   */
  const loadNewWallet = useCallback(async (
    loadedWallet: JWKInterface | WalletDeferredToArConnect,
    newWalletAddress: string = '',
  ) => {
    if (!loadingWallet.current) {
      loadingWallet.current = true;

      if (usingArConnect()) {
        const address = newWalletAddress || await arweave.getWalletAddress(loadedWallet);
        setWalletAddress(address);
        setWallet(loadedWallet);
      }
      else {
        const newWallet : JWKInterface | WalletDeferredToArConnect = isNotEmpty(loadedWallet)
          ? loadedWallet : await arweave.createNewDevWallet();
        if (!valuesEqual(wallet, newWallet)) {
          const address = await arweave.getWalletAddress(newWallet);
          setWalletAddress(address);
          setWallet(newWallet);
        }
      }

      loadingWallet.current = false;
    }
  }, [wallet]);

  const connectArConnect = useCallback(async () => {
    if (!loadingWallet.current) {
      loadingWallet.current = true;

      try {
        await window.arweaveWallet.connect(
          ARCONNECT_PERMISSIONS,
          ARCONNECT_APPINFO,
          ARCONNECT_GATEWAY,
        );
        const allowedPermissions : PermissionType[] = await window.arweaveWallet.getPermissions();
        if (!ARCONNECT_PERMISSIONS.every(perm => allowedPermissions.includes(perm))) {
          // TODO: explain to the user why we need these permissions
          toast('Insufficient permissions! Please try to connect your ArConnect wallet again.',
            { autohideDelay: 5000, variant: 'danger' });
          await window.arweaveWallet.disconnect();
          setTimeout(connectArConnect, 5000); // User can click 'cancel' to break this loop
        }
        else {
          loadingWallet.current = false;
          await loadNewWallet({});
        }
      }
      catch (ex) {
        toast(`Unable to connect to the ArConnect wallet browser extension: ${ex}`,
          { autohideDelay: 5000, variant: 'danger' });
        console.warn(`Unable to connect to the ArConnect wallet browser extension: ${ex}`);
      }
      finally {
        loadingWallet.current = false;
      }
    }
  }, [toast, loadNewWallet]);

  useEffect(() => {
    if (usingArLocal()) loadNewWallet(wallet);
    if (eventListenersLoaded.current) return;

    // Setup event listeners
    eventListenersLoaded.current = true;
    window.addEventListener('walletSwitch', event => {
      const newAddress = event.detail.address;
      loadNewWallet(wallet, newAddress);
    });

    window.addEventListener('arweaveWalletLoaded', () => {
      console.debug('ArConnect loaded => initializing config and permissions');
      connectArConnect();
    });
  }, [wallet, loadNewWallet, connectArConnect]);

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
          dispatchResult: tx.dispatchResult ? tx.dispatchResult as DispatchResultDTO : undefined,
          resultObj: ('errorMessage' in tx.resultObj ? tx.resultObj as unknown as Error
            : tx.resultObj as TransactionDTO),
        } as ArSyncTx));

        setArSyncTxs(arSyncTxsObject);
      }
      catch (ex) {
        const errorMessage = `Error while reading the cached transactions: ${ex}.\n`
                             + 'Cached transactions have been cleared.';
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
