import React, { useContext } from 'react';
import { FaBacon } from 'react-icons/fa';
import SpinButton from './spin-button';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

function SyncButton() {
  const { isRefreshing } = useContext(SubscriptionsContext);
  const { isSyncing, prepareSync } = useContext(ArweaveContext);

  return (
    <SpinButton
      disabled={isRefreshing || isSyncing}
      className={isSyncing ? 'spinning' : ''}
      onClick={prepareSync}
    >
      <FaBacon />
    </SpinButton>
  );
}

export default SyncButton;
