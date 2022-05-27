import React, { createContext, useContext, useState } from 'react';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { getPodcast, refreshSubscriptions } from '../client';
import {
  unixTimestamp,
  podcastsFromDTO,
  hasMetadata,
  concatMessages,
} from '../utils';
import { Podcast } from '../client/interfaces';

interface SubscriptionContextType {
  subscriptions: Podcast[],
  isRefreshing: boolean,
  lastRefreshTime: number,
  subscribe: (id: string) => Promise<boolean>,
  unsubscribe: (id: string) => Promise<void>,
  refresh: (idsToRefresh?: Podcast['subscribeUrl'][] | null, silent?: boolean,
    maxLastRefreshAge?: number) => Promise<[null, null] | [Podcast[], Partial<Podcast>[]]>,
  metadataToSync: Partial<Podcast>[],
  setMetadataToSync: (value: Partial<Podcast>[]) => void,
}

export const SubscriptionsContext = createContext<SubscriptionContextType>({
  subscriptions: [],
  isRefreshing: false,
  lastRefreshTime: 0,
  subscribe: async () => false,
  unsubscribe: async () => {},
  refresh: async () => [null, null],
  metadataToSync: [],
  setMetadataToSync: () => {},
});

function readCachedPodcasts() {
  const cachedSubscriptions = localStorage.getItem('subscriptions');
  const podcasts = cachedSubscriptions ? JSON.parse(cachedSubscriptions) : [];
  return podcastsFromDTO(podcasts);
}

function readMetadataToSync() {
  const cachedMetadata = localStorage.getItem('metadataToSync');
  const podcasts = cachedMetadata ? JSON.parse(cachedMetadata) : [];
  return podcastsFromDTO(podcasts);
}

// TODO: ArSync v1.5+, test me
const SubscriptionsProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useContext(ToastContext);
  const [subscriptions, setSubscriptions] = useState(readCachedPodcasts());
  const [metadataToSync, setMetadataToSync] = useState<Partial<Podcast>[]>(readMetadataToSync());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  async function subscribe(subscribeUrl: string) {
    // TODO: sanitizeUri(subscribeUrl, true)
    if (subscriptions.some(subscription => subscription.subscribeUrl === subscribeUrl)) {
      toast(`You are already subscribed to ${subscribeUrl}.`, { variant: 'danger' });
      return true;
    }

    const { errorMessage, newPodcastMetadata, newPodcastMetadataToSync } =
      await getPodcast(subscribeUrl, metadataToSync);

    if (hasMetadata(newPodcastMetadata)) {
      toast(`Successfully subscribed to ${newPodcastMetadata.title}.`, { variant: 'success' });

      setMetadataToSync(prev => prev.filter(podcast => podcast.subscribeUrl !== subscribeUrl)
        .concat(hasMetadata(newPodcastMetadataToSync) ? newPodcastMetadataToSync : []));
      setSubscriptions(prev => prev.concat(newPodcastMetadata));

      return true;
    }
    if (errorMessage) toast(`${errorMessage}`, { variant: 'danger' });

    return false; // TODO: don't clear text field if returns false
  }

  async function unsubscribe(subscribeUrl: string) {
    // TODO: warn if subscribeUrl has pending metadataToSync
    //       currently, any pending metadataToSync is left but does not survive a refresh
    if (subscriptions.every(subscription => subscription.subscribeUrl !== subscribeUrl)) {
      toast(`You are not subscribed to ${subscribeUrl}.`, { variant: 'danger' });
    }
    else {
      setSubscriptions(prev => prev.filter(podcast => podcast.subscribeUrl !== subscribeUrl));
    }
  }

  /**
   * @param idsToRefresh If `null`, all subscriptions are refreshed
   * @param silent If true, toasts are skipped
   * @param maxLastRefreshAge Only refresh if the last refresh occurred over `maxLastRefreshAge`
   *   seconds ago. If 0, refresh regardless.
   * @returns An array with the resulting subscriptions and metadataToSync
   */
  const refresh = async (idsToRefresh: Podcast['subscribeUrl'][] | null = null, silent = false,
    maxLastRefreshAge = 1) : Promise<[null, null] | [Podcast[], Partial<Podcast>[]]> => {

    if (isRefreshing) return [null, null];
    if (getLastRefreshAge() <= maxLastRefreshAge) return [subscriptions, metadataToSync];

    setIsRefreshing(true);
    try {
      // TODO: T250 ArSync v1.2, include `ArweaveProvider.unconfirmedArSyncTxs.map(x => x.metadata)`
      // in newSubscriptions and exclude it from newMetadataToSync
      const { errorMessages, newSubscriptions, newMetadataToSync } =
        await refreshSubscriptions(subscriptions, metadataToSync, idsToRefresh);

      setLastRefreshTime(unixTimestamp());
      setSubscriptions(newSubscriptions);
      setMetadataToSync(newMetadataToSync);
      setIsRefreshing(false);

      if (!silent) {
        if (errorMessages.length) {
          toast(`Refresh completed with some errors:\n${concatMessages(errorMessages)}`,
            { autohideDelay: 10000, variant: 'warning' });
        }
        else toast('Refresh successful.', { variant: 'success' });
      }

      return [newSubscriptions, newMetadataToSync];
    }
    catch (ex) {
      console.error(ex);
      if (!silent) {
        toast(`Failed to refresh subscriptions, please try again; ${ex}`,
          { autohideDelay: 10000, variant: 'danger' });
      }
    }
    finally {
      setIsRefreshing(false);
    }
    return [null, null];
  };

  const handleMetadataToSync = (value: Partial<Podcast>[]) => {
    setMetadataToSync(value);
  };

  /**
   * @returns The number of seconds since the last refresh
   */
  function getLastRefreshAge() : number {
    if (!lastRefreshTime) return Infinity;

    return Math.max(0, unixTimestamp() - lastRefreshTime);
  }

  useRerenderEffect(() => {
    console.debug('subscriptions have been updated to:', subscriptions);
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useRerenderEffect(() => {
    console.debug('metadataToSync has been updated to:', metadataToSync);
    localStorage.setItem('metadataToSync', JSON.stringify(metadataToSync));
  }, [metadataToSync]);

  return (
    <SubscriptionsContext.Provider
      value={{
        subscriptions,
        isRefreshing,
        lastRefreshTime,
        subscribe,
        unsubscribe,
        refresh,
        metadataToSync,
        setMetadataToSync: handleMetadataToSync,
      }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
};

export default SubscriptionsProvider;
