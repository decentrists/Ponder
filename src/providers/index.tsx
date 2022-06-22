import React from 'react';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import ToastProvider from './toast';
import SubscriptionsProvider from './subscriptions';
import ArweaveProvider from './arweave';
import CytoscapeProvider from './cytoscape';
import { theme } from '../theme';

interface Props {
  children: React.ReactNode;
}

const GlobalProviders : React.FC<Props> = ({ children }) => (
  <ToastProvider>
    <SubscriptionsProvider>
      <ArweaveProvider>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CytoscapeProvider>
              {children}
            </CytoscapeProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </ArweaveProvider>
    </SubscriptionsProvider>
  </ToastProvider>
);

export default GlobalProviders;
