import React, { useContext } from 'react';
import { SubscriptionsContext } from '../providers/subscriptions';
import PodGraph from '../components/pod-graph';
import HeaderComponent from '../components/layout/header-component';
import PodcastList from '../components/podcast-list';

function HomePage() {
  const { subscriptions, subscribe, unsubscribe } = useContext(SubscriptionsContext);

  async function search({ query }) {
    subscribe(query);
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
