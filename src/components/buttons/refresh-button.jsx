import React, { useContext } from 'react';
import { FaSync } from 'react-icons/fa';
import SpinButton from './spin-button';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

function RefreshButton() {
  const { isRefreshing, refresh } = useContext(SubscriptionsContext);
  const { isSyncing } = useContext(ArweaveContext);

  return (
    <SpinButton
      disabled={isRefreshing || isSyncing}
      className={isRefreshing ? 'spinning' : ''}
      onClick={() => refresh(false)}
    >
      <FaSync />
    </SpinButton>
  );
}

export default RefreshButton;
