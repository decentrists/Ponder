import React, { useContext } from 'react';
import { FaBacon } from 'react-icons/fa';
import SpinButton from './spin-button';
import { ArweaveSyncContext } from '../../providers/arweave-sync';

function SyncButton() {
  const { sync, isSyncing } = useContext(ArweaveSyncContext);

  return (
    <SpinButton disabled={isSyncing} onClick={sync}>
      <FaBacon />
    </SpinButton>
  );
}

export default SyncButton;
