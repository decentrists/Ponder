import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { getPodcast, getAllPodcasts } from '../client';
import getCustomStuff from '../components/pod-graph/data'; // TODO: remove this static data and use the subsription context

export const SubscriptionsContext = createContext();

function readCachedPodcasts() {
  const podcasts = JSON.parse(localStorage.getItem('subscriptions')) || getCustomStuff(); // TODO: remove this static data
  return podcasts.map(podcast => ({
    ...podcast,
    episodes: podcast.episodes.map(episode => ({
      ...episode,
      publishedAt: episode.publishedAt && new Date(episode.publishedAt),
    })),
  }));
}

function SubscriptionsProvider({ children }) {
  const toast = useContext(ToastContext);
  const [subscriptions, setSubscriptions] = useState(readCachedPodcasts());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  async function subscribe(subscribeUrl) {
    if (subscriptions.some(subscription => subscription.subscribeUrl === subscribeUrl)) {
      throw new Error('Already subscribed');
    }
    const newPodcast = await getPodcast(subscribeUrl);
    setSubscriptions(prev => prev.concat(newPodcast));
  }

  async function unsubscribe(subscribeUrl) {
    if (subscriptions.every(subscription => subscription.subscribeUrl !== subscribeUrl)) {
      throw new Error('Not subscribed.');
    }
    setSubscriptions(prev => prev
      .filter(subscription => subscription.subscribeUrl !== subscribeUrl));
  }

  async function refresh() {
    setIsRefreshing(true);
    try {
      const podcasts = await getAllPodcasts(subscriptions);
      setSubscriptions(podcasts);
      toast('Refresh Success!', { variant: 'success' });
      return podcasts;
    } catch (ex) {
      console.error(ex);
      toast('Failed to refresh subscriptions.', { variant: 'danger' });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function sync() {
    setIsSyncing(true);
    try {
      const toSync = JSON.parse(localStorage.getItems('subscriptions'));
    } catch (ex) {
      console.error(ex);
      toast('Failed to sync with Arweave.', { variant: 'danger' });
    } finally {
      setIsSyncing(false);
    }
  }

  useRerenderEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  return (
    <SubscriptionsContext.Provider
      value={{
        sync,
        isSyncing,
        subscribe,
        unsubscribe,
        refresh,
        isRefreshing,
        subscriptions: subscriptions
          .map(subscription => ({
            ...subscription,
            episodes: subscription.episodes
              .map(episode => ({
                ...episode,
                publishedAt: episode.publishedAt && new Date(episode.publishedAt),
              }))
              .sort((a, b) => b.publishedAt - a.publishedAt),
          }))
          .map(subscription => ({
            ...subscription,
            firstPublishedAt: subscription.episodes.at(0).publishedAt,
            lastPublishedAt: subscription.episodes.at(-1).publishedAt,
          }))
          .sort((a, b) => a.title.localeCompare(b.title)),
      }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
}

SubscriptionsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SubscriptionsProvider;
