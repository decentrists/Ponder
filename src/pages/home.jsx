import React, { useContext } from 'react';
import { SubscriptionsContext } from '../providers/subscriptions';
import { ToastContext } from '../providers/toast';
import PodGraph from '../components/pod-graph';
import HeaderComponent from '../components/header-component';
import PodcastList from '../components/podcast-list';
import getCustomStuff from '../components/pod-graph/data';

function HomePage() {
  const toast = useContext(ToastContext);
  // TODO: remove this static data and use the subsription context
  const subscriptions = getCustomStuff();
  const { subscribe, unsubscribe } = useContext(SubscriptionsContext);

  async function search({ query }) {
    return subscribe(query).catch(ex => {
      console.error(ex);
      toast('Could not search for podcasts.', {
        variant: 'danger',
      });
    });
  }

  return (
    <div>
      <HeaderComponent onSubmit={search} />
      {subscriptions && (
        <PodGraph subscriptions={subscriptions} />
      )}
      <PodcastList subscriptions={subscriptions} unsubscribe={unsubscribe} />
    </div>
  );
}

export default HomePage;
