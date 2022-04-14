import React from 'react';
import PropTypes from 'prop-types';
import ToastProvider from './toast';
import SubscriptionsProvider from './subscriptions';
import ArweaveProvider from './arweave';
import CytoscapeProvider from './cytoscape';

function GlobalProviders({ children }) {
  return (
    <ToastProvider>
      <SubscriptionsProvider>
        <ArweaveProvider>
          <CytoscapeProvider>
            {children}
          </CytoscapeProvider>
        </ArweaveProvider>
      </SubscriptionsProvider>
    </ToastProvider>
  );
}

GlobalProviders.propTypes = {
  children: PropTypes.node.isRequired,
};

export default GlobalProviders;
