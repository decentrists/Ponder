import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import { createPodcast } from '../client';
import { ArweaveContext } from './arweave';

export const ArweaveSyncContext = createContext();

function ArweaveSyncProvider({ children }) {
  const { getWallet, getWalletAddress } = useContext(ArweaveContext);
  const toast = useContext(ToastContext);
  const [isSyncing, setIsSyncing] = useState(false);

  async function sync() {
    setIsSyncing(true);
    try {
      const podcastsToBeSynced = JSON.parse(localStorage.getItem('toSync'));
      console.log('podcastsToBeSynced', podcastsToBeSynced);
      if (!podcastsToBeSynced.length) toast('There are no podcasts to sync.');
      else {
        const wallet = getWallet();

        // TODO: this is for debugging in ArSync v0.5-1.0
        console.log('walletAddress', getWalletAddress());
        await Promise.all(podcastsToBeSynced.map(podcast => createPodcast(wallet, podcast)));
      }
    } catch (ex) {
      console.error(ex);
      toast('Failed to sync with Arweave.', { variant: 'danger' });
    } finally {
      setIsSyncing(false);
    }

    // setIsSyncing(true);
    // try {
    //   const podcastsToSync = await getNewEpisodes(subscriptions);
    //   podcastsToSync
    //   await Promise.all(podcastsWithNewEpisodes.map(podcast => createPodcast()));
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
