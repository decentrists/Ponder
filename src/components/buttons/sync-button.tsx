import React, { useContext } from 'react';
// @ts-ignore
import { ReactComponent as ArSyncIcon } from '../../assets/arsync-logo.svg';
import SpinButton from './spin-button';
import { SubscriptionsContext } from '../../providers/subscriptions';
import { ArweaveContext } from '../../providers/arweave';

const SyncButton : React.FC = () => {
  const { isRefreshing } = useContext(SubscriptionsContext);
  const { isSyncing, prepareSync, startSync, hasPendingTxs } = useContext(ArweaveContext);

  let disabled = isRefreshing || isSyncing;
  let classes = isSyncing ? 'spinning' : '';
  let onClick = prepareSync;
  let title = 'Prepare pending metadata for upload to Arweave';

  if (hasPendingTxs) {
    disabled = isRefreshing;
    classes += ' hasPendingTxs';
    onClick = startSync;
    title = 'Post the pending transactions to Arweave';
  }

  return (
    <SpinButton
      disabled={disabled}
      className={classes}
      onClick={onClick}
      title={title}
      alt={title}
    >
      <ArSyncIcon
        width={'1.5rem'}
        height={'1.5rem'}
      />
    </SpinButton>
  );
};

export default SyncButton;
