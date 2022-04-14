import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { getPodcast, getAllPodcasts } from '../client';
import { unixTimestamp, podcastsWithDateObjects } from '../utils';

export const SubscriptionsContext = createContext();

function readCachedPodcasts() {
  const podcasts = JSON.parse(localStorage.getItem('subscriptions')) || [];
  return podcastsWithDateObjects(podcasts);
}

function SubscriptionsProvider({ children }) {
  const toast = useContext(ToastContext);
  const [subscriptions, setSubscriptions] = useState(readCachedPodcasts());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  // const [isSyncing, setIsSyncing] = useState(false);

  async function subscribe(subscribeUrl) {
    // TODO: subscribeUrl validation
    if (subscriptions.some(subscription => subscription.subscribeUrl === subscribeUrl)) {
      toast(`You are already subscribed to ${subscribeUrl}.`, { variant: 'danger' });
    }
    else {
      const newPodcast = await getPodcast(subscribeUrl);
      setSubscriptions(prev => prev.concat(newPodcast));
    }
  }

  async function unsubscribe(subscribeUrl) {
    if (subscriptions.every(subscription => subscription.subscribeUrl !== subscribeUrl)) {
      toast(`You are not subscribed to ${subscribeUrl}.`, { variant: 'danger' });
    }
    else {
      setSubscriptions(prev => prev
        .filter(subscription => subscription.subscribeUrl !== subscribeUrl));
    }
  }

  async function refresh() {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const newSubscriptions = await getAllPodcasts(subscriptions);
      // TODO: merge (subscriptions, newSubscriptions)
      setSubscriptions(podcastsWithDateObjects(newSubscriptions));
      setLastRefreshTime(unixTimestamp());
      toast('Refresh Success!', { variant: 'success' });
    } catch (ex) {
      console.error(ex);
      toast(`Failed to refresh subscriptions: ${ex}`, { variant: 'danger' });
    } finally {
      setIsRefreshing(false);
    }
  }

  useRerenderEffect(() => {
    localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  return (
    <SubscriptionsContext.Provider
      value={{
        // isSyncing,
        isRefreshing,
        lastRefreshTime,
        subscribe,
        unsubscribe,
        refresh,
        subscriptions: podcastsWithDateObjects(subscriptions),
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
