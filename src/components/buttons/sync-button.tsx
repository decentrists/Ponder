import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import style from './style.module.scss';
import { ReactComponent as ArSyncIcon } from '../../assets/arsync-logo.svg';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

const SyncButton : React.FC = () => {
  const { isRefreshing } = useContext(SubscriptionsContext);
  const { isSyncing, prepareSync, startSync, hasPendingTxs } = useContext(ArweaveContext);

  let disabled = isRefreshing || isSyncing;
  let onClick = prepareSync;
  let title = 'Prepare pending metadata for upload to Arweave';

  if (hasPendingTxs) {
    disabled = isRefreshing;
    onClick = startSync;
    title = 'Post the pending transactions to Arweave';
  }

  return (
    <Button
      disabled={disabled}
      className={`${style['spin-button']} ${hasPendingTxs ? style['sync-initialized'] : ''} ${
        isSyncing ? style.spinning : ''}`}
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
