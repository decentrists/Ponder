import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ArweaveContext } from './arweave';
import { ToastContext } from './toast';
import { postPodcastMetadata } from '../client/arweave';

export const ArweaveSyncContext = createContext();

function ArweaveSyncProvider({ children }) {
  const { wallet, walletAddress } = useContext(ArweaveContext);
  const toast = useContext(ToastContext);
  const [isSyncing, setIsSyncing] = useState(false);

  async function sync() {
    setIsSyncing(true);
    try {
      const podcastsToSync = JSON.parse(localStorage.getItem('podcastsToSync'));
      console.log('podcastsToBeSynced', podcastsToSync);

      if (!podcastsToSync.length) toast('There are no podcasts to sync.');
      else {
        // TODO: this is for debugging in ArSync v0.5-1.0
        console.log('walletAddress', walletAddress);
        await Promise.all(podcastsToSync.map(podcast => postPodcastMetadata(wallet, podcast)));
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

  return (
    <ArweaveSyncContext.Provider
      value={{
        isSyncing,
        sync,
      }}
    >
      {children}
    </ArweaveSyncContext.Provider>
  );
}

ArweaveSyncProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ArweaveSyncProvider;
