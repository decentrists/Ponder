import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { getPodcast, refreshSubscriptions } from '../client';
import {
  unixTimestamp,
  hasMetadata,
  concatMessages,
} from '../utils';
import { Episode, EpisodesDBTable, Podcast } from '../client/interfaces';
import IndexedDb from '../indexed-db';
import { ArSyncTx } from '../client/arweave/sync';

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
  readCachedArSyncTxs: () => Promise<ArSyncTx[]>,
  writeCachedArSyncTxs: (newValue: ArSyncTx[]) => void,
  dbStatus: DBStatus,
  setDbStatus: (value: DBStatus) => void,
}

export enum DBStatus {
  UNINITIALIZED,
  INITIALIZING1,
  INITIALIZING2,
  INITIALIZING3, // 'subscriptions' and 'metadataToSync' initialized
  INITIALIZED, // 'subscriptions', 'metadataToSync' and 'arSyncTxs' initialized
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
  readCachedArSyncTxs: async () => [],
  writeCachedArSyncTxs: async () => {},
  dbStatus: 0,
  setDbStatus: () => {},
});

const DB_SUBSCRIPTIONS = 'subscriptions';
const DB_EPISODES = 'episodes';
const DB_METADATATOSYNC = 'metadataToSync';
const DB_ARSYNCTXS = 'arSyncTxs';

const db = new IndexedDb();
window.idb = db;

async function readCachedPodcasts() : Promise<Podcast[]> {
  console.debug('readCachedPodcasts');

  const readPodcasts : Podcast[] = [];

  let cachedSubscriptions : Podcast[] = await db.getAllValues(DB_SUBSCRIPTIONS);
  cachedSubscriptions ||= [];
  let cachedEpisodes : EpisodesDBTable[] = await db.getAllValues(DB_EPISODES);
  cachedEpisodes ||= [];

  cachedSubscriptions.forEach(sub => {
    const episodesTable : EpisodesDBTable | undefined =
      cachedEpisodes.find(table => table.subscribeUrl === sub.subscribeUrl);
    const episodes = episodesTable ? episodesTable.episodes : [];
    const podcast : Podcast = { ...sub, episodes };
    readPodcasts.push(podcast);
  });

  return readPodcasts;
}

async function writeCachedPodcasts(subscriptions: Podcast[]) : Promise<string[]> {
  console.debug('writeCachedPodcasts');

  const errorMessages : string[] = [];

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      const { episodes, ...podcast } = { ...sub };
      const cachedSub : Podcast = await db.getBySubscribeUrl(DB_SUBSCRIPTIONS, sub.subscribeUrl);

      if (!cachedSub || cachedSub.lastMutatedAt !== podcast.lastMutatedAt) {
        const episodesTable : EpisodesDBTable = {
          subscribeUrl: podcast.subscribeUrl,
          episodes: episodes as Episode[],
        };
        await db.putValue(DB_SUBSCRIPTIONS, podcast);
        await db.putValue(DB_EPISODES, episodesTable);
      }
    }
    catch (ex) {
      errorMessages.push(`${ex}`);
    }
  }));

  return errorMessages;
}

async function readCachedMetadataToSync() : Promise<Partial<Podcast>[]> {
  console.debug('readCachedMetadataToSync');

  let fetchedData : Partial<Podcast>[] = [];
  try {
    fetchedData = await db.getAllValues(DB_METADATATOSYNC);
  }
  catch (_ex) {}

  return fetchedData;
}

/**
 * `metadataToSync` is updated on each subscriptions refresh, but we still cache it, because f.i. it
 * contains any pending user posts.
 * @param newValue
 * @throws
 */
async function writeCachedMetadataToSync(newValue: Partial<Podcast>[]) {
  console.debug('writeCachedMetadataToSync');

  await db.clearAllValues(DB_METADATATOSYNC);
  await db.putValues(DB_METADATATOSYNC, newValue);
}

async function removeCachedSubscription(subscribeUrl: Podcast['subscribeUrl']) {
  try {
    await db.deleteSubscription(DB_SUBSCRIPTIONS, subscribeUrl);
    await db.deleteSubscription(DB_EPISODES, subscribeUrl);
  }
  catch (_ex) {}
}

// TODO: ArSync v1.5+, test me
const SubscriptionsProvider : React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useContext(ToastContext);
  const [dbStatus, setDbStatus] = useState(DBStatus.UNINITIALIZED);
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

  /**
   * @returns The number of seconds since the last refresh
   */
  function getLastRefreshAge() : number {
    if (!lastRefreshTime) return Infinity;

    return Math.max(0, unixTimestamp() - lastRefreshTime);
  }

  const readCachedArSyncTxs = async () : Promise<ArSyncTx[]> => {
    console.debug('readCachedArSyncTxs');
    const fetchedData : ArSyncTx[] = await db.getAllValues(DB_ARSYNCTXS);
    return fetchedData;
  };

  const writeCachedArSyncTxs = async (newValue: ArSyncTx[]) => {
    console.debug('writeCachedArSyncTxs');
    await db.clearAllValues(DB_ARSYNCTXS);
    await db.putValues(DB_ARSYNCTXS, newValue);
  };

  useEffect(() => {
    const initializeSubscriptions = async () => {
      console.debug('Initializing subscriptions');
      const fetchedData = await readCachedPodcasts();
      setSubscriptions(fetchedData);
    };

    const initializeMetadataToSync = async () => {
      console.debug('Initializing metadataToSync');
      const fetchedData = await readCachedMetadataToSync();
      setMetadataToSync(fetchedData);
    };

    const initializeDatabase = async () => {
      if (dbStatus > DBStatus.UNINITIALIZED) return;

      setDbStatus(prev => prev + 1);
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
  }, [dbStatus, toast]);

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
    if (dbStatus >= DBStatus.INITIALIZED) updateCachedPodcasts();
    else setDbStatus(prev => Math.min(prev + 1, DBStatus.INITIALIZING3));
  }, [subscriptions]);

  useRerenderEffect(() => {
    const updateCachedMetadataToSync = async () => {
      await writeCachedMetadataToSync(metadataToSync);
    };

    console.debug('metadataToSync has been updated to:', metadataToSync);
    if (dbStatus >= DBStatus.INITIALIZED) updateCachedMetadataToSync();
    else setDbStatus(prev => Math.min(prev + 1, DBStatus.INITIALIZING3));
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
        setMetadataToSync,
        readCachedArSyncTxs,
        writeCachedArSyncTxs,
        dbStatus,
        setDbStatus,
      }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
};

export default SubscriptionsProvider;
