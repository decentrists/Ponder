import React, { useContext } from 'react';
import { FaSync } from 'react-icons/fa';
import { SubscriptionsContext } from '../../providers/subscriptions';
import SpinButton from './spin-button';

function RefreshButton() {
  const { refresh, isRefreshing } = useContext(SubscriptionsContext);

  return (
    <SpinButton disabled={isRefreshing} onClick={refresh}>
      <FaSync />
    </SpinButton>
  );
}

export default RefreshButton;
