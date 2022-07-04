import React, { useContext } from 'react';
import { FaSync } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import style from './style.module.scss';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

function RefreshButton() {
  const { isRefreshing, refresh } = useContext(SubscriptionsContext);
  const { isSyncing, hasPendingTxs } = useContext(ArweaveContext);

  return (
    <Button
      disabled={isRefreshing || isSyncing || hasPendingTxs}
      className={`${style['spin-button']} ${isRefreshing ? style.spinning : ''}`}
      onClick={() => refresh(null, false)}
      title="Refresh subscriptions from RSS & Arweave"
      alt="Refresh"
    >
      <FaSync />
    </Button>
  );
}

export default RefreshButton;
