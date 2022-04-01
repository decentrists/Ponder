import React, {
  createContext, useState, useRef, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import * as arweave from '../client/arweave';

export const ArweaveContext = createContext();

function ArweaveProvider({ children }) {
  const [podcastsToSync, setPodcastsToSync] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [episodesToSync, setEpisodesToSync] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const loadingWallet = useRef(false);

  /* Loads the state variables `wallet` and `walletAddress` for the given `newWallet`.
   * If !newWallet, a new developer wallet is created and some AR tokens are minted.
   * @param [Object, null] newWallet */
  async function loadNewWallet(newWallet) {
    if (!loadingWallet.current) {
      loadingWallet.current = true;

      const userOrDevWallet = newWallet || await arweave.createNewDevWallet();
      setWallet(userOrDevWallet);
      setWalletAddress(await arweave.getWalletAddress(userOrDevWallet));

      loadingWallet.current = false;
    }
  }

  useEffect(() => {
    loadNewWallet(wallet);
  }, [wallet]);

  return (
    <ArweaveContext.Provider
      value={{
        hasItemsToSync: !!(podcastsToSync.length || setPodcastsToSync.length),
        wallet,
        walletAddress,
        loadNewWallet,

        async getPodcastFeed(rssUrl) {
          arweave.getPodcastFeed(rssUrl).then(setEpisodesToSync);
        },

        // async sync() {

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
