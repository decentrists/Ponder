import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { getPodcast, refreshSubscriptions } from '../client';
import {
  unixTimestamp,
  podcastsFromDTO,
  hasMetadata,
  concatMessages,
} from '../utils';
import { Episode, EpisodesDBTable, Podcast } from '../client/interfaces';
import IndexedDb from '../indexed-db';

// TODO: Remove after IndexedDB implementation maturation
declare global {
  interface Window {
    idb : IndexedDb;
  }
}

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

const db = new IndexedDb('Ponder');
window.idb = db;

async function readCachedPodcasts() : Promise<Podcast[]> {
  console.debug('readCachedPodcasts');

  const readPodcasts : Podcast[] = [];

  let cachedSubscriptions : Podcast[] = await db.getAllValues('subscriptions');
  cachedSubscriptions ||= [];
  let cachedEpisodes : EpisodesDBTable[] = await db.getAllValues('episodes');
  cachedEpisodes ||= [];

  cachedSubscriptions.forEach(sub => {
    const episodesTable : EpisodesDBTable | undefined =
      cachedEpisodes.find(table => table.subscribeUrl === sub.subscribeUrl);
    const episodes = episodesTable ? episodesTable.episodes : [];
    const podcast : Podcast = { ...sub, episodes };
    readPodcasts.push(podcast);
  });

  console.debug('readPodcasts', readPodcasts);
  return readPodcasts;
}

async function writeCachedPodcasts(subscriptions: Podcast[]) {
  console.debug('writeCachedPodcasts');

  const errorMessages : string[] = [];

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      const { episodes, ...podcast } = { ...sub };
      const cachedSub : Podcast = await db.getBySubscribeUrl('subscriptions', sub.subscribeUrl);

      if (!cachedSub || cachedSub.lastMutatedAt !== podcast.lastMutatedAt) {
        const episodesTable : EpisodesDBTable = {
          subscribeUrl: podcast.subscribeUrl,
          episodes: episodes as Episode[],
        };
        await db.putValue('subscriptions', podcast);
        await db.putValue('episodes', episodesTable);
      }
    }
    catch (ex) {
      errorMessages.push(`${ex}`);
    }
  }));

  return errorMessages;
}

async function removeCachedSubscription(subscribeUrl: Podcast['subscribeUrl']) {
  try {
    await db.deleteSubscription('subscriptions', subscribeUrl);
    await db.deleteSubscription('episodes', subscribeUrl);
  }
  catch (ex) {}
}

function readMetadataToSync() {
  const cachedMetadata = localStorage.getItem('metadataToSync');
  const podcasts = cachedMetadata ? JSON.parse(cachedMetadata) : [];
  return podcastsFromDTO(podcasts);
}

// TODO: ArSync v1.5+, test me
const SubscriptionsProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useContext(ToastContext);
  const dbInitialized = useRef(false);
  const [subscriptions, setSubscriptions] = useState<Podcast[]>([]);
  const [metadataToSync, setMetadataToSync] = useState<Partial<Podcast>[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  async function subscribe(subscribeUrl: Podcast['subscribeUrl']) {
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

  async function unsubscribe(subscribeUrl: Podcast['subscribeUrl']) {
    // TODO: warn if subscribeUrl has pending metadataToSync
    //       currently, any pending metadataToSync is left but does not survive a refresh
    if (subscriptions.every(subscription => subscription.subscribeUrl !== subscribeUrl)) {
      toast(`You are not subscribed to ${subscribeUrl}.`, { variant: 'danger' });
    }
    else {
      await removeCachedSubscription(subscribeUrl);
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

  useEffect(() => {
    const initializeSubscriptions = async () => {
      console.debug('Initializing subscriptions');
      const fetched = await readCachedPodcasts();
      if (fetched) setSubscriptions(fetched);
    };

    const initializeMetadataToSync = async () => {
      console.debug('Initializing metadataToSync');
      const fetched = await readMetadataToSync();
      setMetadataToSync(fetched);
    };

    const initializeDatabase = async () => {
      if (dbInitialized.current) return;

      dbInitialized.current = true;
      console.debug('Initializing DB', db);

      try {
        await db.initializeDBSchema();
        await initializeSubscriptions();
        await initializeMetadataToSync();
      }
      catch (ex) {
        const errorMessage = 'An error occurred while fetching the cached subscriptions from ' +
          `IndexedDB:\n${(ex as Error).message}\n${IndexedDb.DB_ERROR_GENERIC_HELP_MESSAGE}`;
        console.error(errorMessage);
        toast(errorMessage, { autohideDelay: 0, variant: 'danger' });
      }
    };

    initializeDatabase();
  }, [toast]);

  useRerenderEffect(() => {
    const updateCachedPodcasts = async () => {
      const errorMessages = await writeCachedPodcasts(subscriptions);
      if (errorMessages.length) {
        const errorMessage = 'Some subscriptions failed to be cached into IndexedDB:\n' +
          `${IndexedDb.DB_ERROR_GENERIC_HELP_MESSAGE}\n${concatMessages(errorMessages)}`;
        console.error(errorMessage);
        toast(errorMessage, { autohideDelay: 0, variant: 'danger' });
      }
    };

    console.debug('subscriptions have been updated to:', subscriptions);
    updateCachedPodcasts();
  }, [subscriptions]);

  useRerenderEffect(() => {
    console.debug('metadataToSync has been updated to:', metadataToSync);
    // TODO: Migrate to IndexedDB
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
