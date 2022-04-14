import React, {
  createContext, useState, useContext, useRef, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
// import { SubscriptionsContext } from './subscriptions';
import * as arweave from '../client/arweave';
// import * as arsync from '../client/arweave/sync';
import { valuesEqual } from '../utils';

export const ArweaveContext = createContext();

function ArweaveProvider({ children }) {
  // const { subscriptions } = useContext(SubscriptionsContext);
  const toast = useContext(ToastContext);
  const [wallet, setWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const loadingWallet = useRef(false);

  /* TODO: clear value within 10mins (?) of setting, as the pendingTxs may have become stale. */
  const pendingTxs = useRef([]);

  /**
   * Loads the state variables `wallet` and `walletAddress` for the given `newWallet`.
   * If !newWallet, a new developer wallet is created and some AR tokens are minted.
   * @param {(Object|null)} newWallet
   */
  async function loadNewWallet(newWallet) {
    if (!loadingWallet.current) {
      loadingWallet.current = true;

      const userOrDevWallet = newWallet || await arweave.createNewDevWallet();
      if (!valuesEqual(wallet, newWallet)) {
        setWalletAddress(await arweave.getWalletAddress(userOrDevWallet));
        setWallet(userOrDevWallet);
      }

      loadingWallet.current = false;
    }
  }

  async function sync() {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const podcastsToSync = JSON.parse(localStorage.getItem('podcastsToSync'));
      console.log('podcastsToBeSynced', podcastsToSync);

      if (!podcastsToSync.length) toast('There are no podcasts to sync.');
      else {
        // TODO: this is for debugging in ArSync v0.5-1.0
        console.log('walletAddress', walletAddress);
        // await Promise.all(podcastsToSync.map(podcast => postPodcastMetadata(wallet, podcast)));
      }
    }
    catch (ex) {
      console.error(ex);
      toast('Failed to sync with Arweave.', { variant: 'danger' });
    }
    finally {
      setIsSyncing(false);
    }

    // setIsSyncing(true);
    // try {
    //   const podcastsToSync = await getNewEpisodes(subscriptions);
    //   podcastsToSync
    //   await Promise.all(podcastsWithNewEpisodes.map(podcast => postPodcastMetadata()));
    //   toast('Sync Complete', { variant: 'success' });
    // } catch (ex) {
    //   console.error(ex);
    //   toast('Failed to sync to Arweave.', { variant: 'danger' });
    // } finally {
    //   setIsSyncing(true);
    // }
  }

  // async function initSyncTxs() {
  //   const result = [];
  //   const metadataToSync = await arsync.getMetadataToSync();
  //   result.push();
  //   pendingTxs.current = result.flat();
  //   console.log('pendingTxs.current', pendingTxs.current);
  // }

  // async function initMetadataToSync() {

  // }

  async function hasPendingTxs() {
    return !!pendingTxs.length;
  }

  useEffect(() => {
    loadNewWallet(wallet);
  }, [wallet]);

  return (
    <ArweaveContext.Provider
      value={{
        isSyncing,
        wallet,
        walletAddress,
        loadNewWallet,
        sync,
        // initSyncTxs,
        // initMetadataToSync,
        hasPendingTxs,

        // async getPodcastFeed(rssUrl) {
        //   console.log(`ArweaveProvider.getPodcastFeed(${rssUrl})`);
        //   const result = arweave.getPodcastFeed(rssUrl);
        //   return result; // TODO
        // },
      }}
    >
      {children}
    </ArweaveContext.Provider>
  );
}

ArweaveProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ArweaveProvider;
