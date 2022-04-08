import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ToastContext } from './toast';
import useRerenderEffect from '../hooks/use-rerender-effect';
import { getPodcast, getAllPodcasts } from '../client';
import { withDateObjects } from '../utils';

export const SubscriptionsContext = createContext();

function readCachedPodcasts() {
  const podcasts = JSON.parse(localStorage.getItem('subscriptions')) || [];

  return withDateObjects(podcasts);
}

function SubscriptionsProvider({ children }) {
  const toast = useContext(ToastContext);
  const [subscriptions, setSubscriptions] = useState(readCachedPodcasts());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  async function subscribe(subscribeUrl) {
    // TODO: subscribeUrl validation
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
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const newSubscriptions = await getAllPodcasts(subscriptions);
      setSubscriptions(withDateObjects(newSubscriptions));
      toast('Refresh Success!', { variant: 'success' });
    } catch (ex) {
      console.error(ex);
      toast(`Failed to refresh subscriptions: ${ex}`, { variant: 'danger' });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function sync() {
    setIsSyncing(true);
    try {
      // const toSync = JSON.parse(localStorage.getItems('subscriptions'));
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
        subscriptions: withDateObjects(subscriptions),
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
