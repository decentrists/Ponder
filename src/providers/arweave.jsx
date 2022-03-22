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
          if (!walletAddress) {
            if (!wallet) {
              await setWallet(arweave.createNewDevWallet());
            }
            await setWalletAddress(arweave.getWalletAddress(wallet));
          }
          return walletAddress;
        },

        async getWallet() {
          if (!wallet) {
            await setWallet(arweave.createNewDevWallet());
            await setWalletAddress(arweave.getWalletAddress(wallet));
          }
          return walletAddress;
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
