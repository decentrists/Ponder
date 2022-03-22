import React from 'react';
import PropTypes from 'prop-types';
import ToastProvider from './toast';
import SubscriptionsProvider from './subscriptions';
import ArweaveProvider from './arweave';
import ArweaveSyncProvider from './arweave-sync';
import CytoscapeProvider from './cytoscape';

function GlobalProviders({ children }) {
  return (
    <ToastProvider>
      <SubscriptionsProvider>
        <ArweaveProvider>
          <ArweaveSyncProvider>
            <CytoscapeProvider>
              {children}
            </CytoscapeProvider>
          </ArweaveSyncProvider>
        </ArweaveProvider>
      </SubscriptionsProvider>
    </ToastProvider>
  );
}

GlobalProviders.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalProviders;
