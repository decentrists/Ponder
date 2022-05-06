import React, {
  createContext, useState, useContext, useRef, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { SubscriptionsContext } from './subscriptions';
import * as arweave from '../client/arweave';
import * as arsync from '../client/arweave/sync';
import { isNotEmpty, valuesEqual, concatMessages } from '../utils';
import { JWKInterface } from 'arweave/node/lib/wallet';
import Transaction from 'arweave/node/lib/transaction';
import { TransactionStatus } from '../client/arweave/sync';

export const ArweaveContext = createContext();

// TODO: ArSync v1.5+, test me
const ArweaveProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refresh, setMetadataToSync } = useContext(SubscriptionsContext);
  const toast = useContext(ToastContext);
  const [wallet, setWallet] = useState<JWKInterface>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  // TODO: clear value within 10mins (?) of setting, as the pendingTxsToSync may have become stale
  const [pendingArSyncTxs, setPendingArSyncTxs] = useState<TransactionStatus<Transaction>[]>([]);
  const loadingWallet = useRef(false);


  // TODO: Determine transaction status after pendingArSyncTxs have been posted and signed.
  // https://github.com/ArweaveTeam/arweave-js#get-a-transaction-status
  // const [unconfirmedArSyncTxs, setUnconfirmedArSyncTxs] = useState([]);

  function hasPendingTxs() {
    return !!pendingArSyncTxs.length;
  }

  /**
   * Loads the state variables `wallet` and `walletAddress` for the given `newWallet`.
   * If !newWallet, a new developer wallet is created and some AR tokens are minted.
   * @param {(Object|null)} newWallet
   */
  const loadNewWallet = useCallback(async (newWallet: JWKInterface) => {
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

  async function prepareSync() {
    if (isSyncing || hasPendingTxs()) return;

    setIsSyncing(true);

    const [newSubscriptions, newMetadataToSync] = await refresh(true);

    if (!isNotEmpty(newSubscriptions)) {
      // TODO: make toast dynamic based on activeSyncTypes
      return cancelSync('Failed to refresh subscriptions.');
    }
    if (!isNotEmpty(newMetadataToSync)) {
      // TODO: make toast dynamic based on activeSyncTypes
      return cancelSync('Subscribed podcasts are already up-to-date.', 'info');
    }

    let result;
    try {
      result = await arsync.initArSyncTxs(newSubscriptions, newMetadataToSync, wallet);
    }
    catch (ex) {
      console.error(ex);
      return cancelSync(`Failed to sync with Arweave: ${ex}`);
    }
    const { txs, failedTxs } = result;

    if (!isNotEmpty(txs)) {
      if (!isNotEmpty(failedTxs)) {
        return cancelSync('Subscribed podcasts are already up-to-date.', 'info');
      }
      // Rare situation where all transactions failed to create; probably due to invalid wallet
      return cancelSync(`Failed to sync with Arweave: ${failedTxs[0].resultObj}`);
    }

    // TODO: pending T252, add txs to transaction cache
    // TODO: check that each txs.resultObj is a valid Arweave Transaction object
    setPendingArSyncTxs(txs);
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
      setPendingArSyncTxs([]);
    }
  }

  async function startSync() {
    if (!isSyncing || !hasPendingTxs()) return cancelSync();

    let result;
    try {
      result = await arsync.startSync(pendingArSyncTxs, wallet);
    }
    catch (ex) {
      console.error(ex);
      return cancelSync(`Failed to sync with Arweave: ${ex}`);
    }
    const { txs, failedTxs } = result;

    if (isNotEmpty(txs)) {
      const message = concatMessages(txs.map(elem => elem.title));
      const plural = txs.length > 1 ? 's' : '';
      toast(`Transaction${plural} successfully posted to Arweave with metadata for:\n${message}`,
        { autohideDelay: 10000, variant: 'success' });
    }
    if (isNotEmpty(failedTxs)) {
      const message =
        concatMessages(failedTxs.map(elem => `${elem.title}, reason:\n${elem.resultObj}\n`));
      const plural = failedTxs.length > 1 ? 's' : '';
      toast(`Transaction${plural} failed to post to Arweave with metadata for:\n${message}`,
        { autohideDelay: 0, variant: 'danger' });
    }
    setMetadataToSync(arsync.formatNewMetadataToSync(failedTxs));
    // setUnconfirmedArSyncTxs(prev => prev.concat(txs));
    setIsSyncing(false);
    setPendingArSyncTxs([]);
  }

  useEffect(() => {
    loadNewWallet(wallet);
  }, [wallet, loadNewWallet]);

  useRerenderEffect(() => {
    // Temporary wrapper for startSync(). TODO: remove in ArSync v1.2+, when intermediate user
    // confirmation of `pendingArSyncTxs` is implemented.
    const startSyncIfPending = async () => {
      await startSync();
    };
    startSyncIfPending();
  }, [pendingArSyncTxs]);

  return (
    <ArweaveContext.Provider
      value={{
        isSyncing,
        wallet,
        walletAddress,
        loadNewWallet,
        prepareSync,
        hasPendingTxs,
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
