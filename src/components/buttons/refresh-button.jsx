import React, { useContext } from 'react';
import { FaSync } from 'react-icons/fa';
import SpinButton from './spin-button';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

function RefreshButton() {
  const { isRefreshing, refresh } = useContext(SubscriptionsContext);
  const { isSyncing, hasPendingTxs } = useContext(ArweaveContext);

  return (
    <SpinButton
      disabled={isRefreshing || isSyncing || hasPendingTxs}
      className={isRefreshing ? 'spinning' : ''}
      onClick={() => refresh(null, false)}
      title={'Refresh subscriptions from RSS & Arweave'}
      alt={'Refresh'}
    >
      <FaSync />
    </SpinButton>
  );
}

export default RefreshButton;
