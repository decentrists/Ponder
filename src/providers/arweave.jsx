import React, { createContext, useState } from 'react';
import PropTypes from 'prop-types';
import * as arweave from '../client/arweave';

export const ArweaveContext = createContext();

function ArweaveProvider({ children }) {
  const [podcastsToSync, setPodcastsToSync] = useState([]);
  const [episodesToSync, setEpisodesToSync] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');

  return (
    <ArweaveContext.Provider
      value={{
        hasItemsToSync: !!(podcastsToSync.length || setPodcastsToSync.length),

        async getWalletAddress() {
          if (walletAddress) return walletAddress;
          let devWallet = wallet;
          if (!devWallet) {
            devWallet = await arweave.createNewDevWallet();
            setWallet(devWallet);
          }
          const walletAddr = await arweave.getWalletAddress(devWallet);
          setWalletAddress(walletAddr);
          return walletAddr;
        },

        async getWallet() {
          let devWallet = wallet;
          if (!devWallet) {
            devWallet = await arweave.createNewDevWallet();
            setWallet(devWallet);
          }
          return devWallet;
        },

        async getPodcastFeed(rssUrl) {
          arweave.getPodcastFeed(rssUrl).then(setEpisodesToSync);
        },

        async sync() {
          // if (episodesToSync.length) {

          // }
        },
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
