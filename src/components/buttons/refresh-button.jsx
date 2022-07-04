import React, { useContext, useState, useEffect } from 'react';
import { FaSync } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import style from './style.module.scss';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

function RefreshButton() {
  const { isRefreshing, refresh } = useContext(SubscriptionsContext);
  const { isSyncing, hasPendingTxs } = useContext(ArweaveContext);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (isRefreshing) {
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
      }, 2000);
    }
  }, [isRefreshing]);

  return (
    <Button
      disabled={isRefreshing || isSyncing || hasPendingTxs}
      className={`${style['spin-button']} ${style[spinning ? 'spinning' : '']}`}
      onClick={() => refresh(null, false)}
      title="Refresh subscriptions from RSS & Arweave"
      alt="Refresh"
    >
      <FaSync />
    </Button>
  );
}

export default RefreshButton;
