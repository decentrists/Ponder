import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import style from './style.module.scss';
// @ts-ignore
import { ReactComponent as ArSyncIcon } from '../../assets/arsync-logo.svg';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

const SyncButton : React.FC = () => {
  const { isRefreshing } = useContext(SubscriptionsContext);
  const { isSyncing, prepareSync, startSync, hasPendingTxs } = useContext(ArweaveContext);
  const [spinning, setSpinning] = useState(false);

  let disabled = isRefreshing || isSyncing;
  let classes = spinning ? 'spinning' : '';
  let onClick = prepareSync;
  let title = 'Prepare pending metadata for upload to Arweave';

  useEffect(() => {
    if (isSyncing) {
      setSpinning(true);
      setTimeout(() => {
        setSpinning(false);
      }, 2000);
    }
  }, [isSyncing]);

  if (hasPendingTxs) {
    disabled = isRefreshing;
    classes += ' hasPendingTxs';
    onClick = startSync;
    title = 'Post the pending transactions to Arweave';
  }

  return (
    <Button
      disabled={disabled}
      className={`${style['spin-button']} ${style[classes]}`}
      onClick={onClick}
      title={title}
    >
      <ArSyncIcon
        width="1.5rem"
        height="1.5rem"
      />
    </Button>
  );
};

export default SyncButton;
