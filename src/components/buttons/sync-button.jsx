import React, { useContext } from 'react';
import { FaBacon } from 'react-icons/fa';
import SpinButton from './spin-button';
import { ArweaveContext } from '../../providers/arweave';

function SyncButton() {
  const { sync, isSyncing } = useContext(ArweaveContext);

  return (
    <SpinButton disabled={isSyncing} onClick={sync}>
      <FaBacon />
    </SpinButton>
  );
}

export default SyncButton;
