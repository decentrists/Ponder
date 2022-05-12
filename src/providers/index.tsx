import React from 'react';
import ToastProvider from './toast';
import SubscriptionsProvider from './subscriptions';
import ArweaveProvider from './arweave';
import CytoscapeProvider from './cytoscape';

interface Props {
  children: React.ReactNode;
}

const GlobalProviders : React.FC<Props> = ({ children }) => {
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
};

export default GlobalProviders;
