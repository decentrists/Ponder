import React, { useContext, useRef } from 'react';
import {
  Box, Tabs, Tab,
} from '@mui/material';
import { SubscriptionsContext } from '../providers/subscriptions';
import { ArweaveContext } from '../providers/arweave';
import PodGraph from '../components/pod-graph';
import HeaderComponent from '../components/layout/header-component';
import {
  Wrapper, LeftPane, RightPane,
} from '../components/shared-elements';
import CategoriesList from '../components/categories-list';
import PodcastList from '../components/podcast-list';
import TransactionList from '../components/transaction-list';

function HomePage() {
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  const { subscriptions, subscribe, unsubscribe } = useContext(SubscriptionsContext);
  const { arSyncTxs, removeArSyncTxs } = useContext(ArweaveContext);
  const activeTab = useRef(0);

  const handleTabChange = (clickedTab: number) => {
    const toggleClass = (elementId: string, className: string, enabled: boolean) => {
      const el = document.getElementById(elementId);
      if (el) enabled ? el.classList.add(className) : el.classList.remove(className);
    };

    const changeTabVisibility = (tabId: number, hidden: boolean) => {
      toggleClass(`simple-tabpanel-${tabId}`, 'hidden', hidden);
      toggleClass(`simple-tab-${tabId}`, 'Mui-selected', !hidden);
    };

    changeTabVisibility(activeTab.current, true);
    changeTabVisibility(clickedTab, false);
    activeTab.current = clickedTab;
  };

  const tabHeaderProps = (index: number) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
      onClick: () => handleTabChange(index),
    };
  };

  const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role='tabpanel'
        className={`tabpanel-element ${index !== value ? 'hidden' : ''}`}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {<Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  };

  async function search({ query } : { query: string }) {
    subscribe(query);
  }

  return (
    <div>
      <HeaderComponent onSubmit={search} />

      {subscriptions && (
        <PodGraph subscriptions={subscriptions} />
      )}

      <Wrapper>
        <LeftPane>
          <CategoriesList categories={[]} />
        </LeftPane>
        <RightPane>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab.current} aria-label='Info tabs'>
                <Tab className='tabheader' label='Subscriptions' {...tabHeaderProps(0)} />
                <Tab className='tabheader' label='Transactions' {...tabHeaderProps(1)} />
              </Tabs>
            </Box>

            <TabPanel value={activeTab.current} index={0}>
              <PodcastList subscriptions={subscriptions} unsubscribe={unsubscribe} />
            </TabPanel>

            <TabPanel value={activeTab.current} index={1}>
              <TransactionList
                subscriptions={subscriptions}
                txs={arSyncTxs}
                removeArSyncTxs={removeArSyncTxs}
              />
            </TabPanel>
          </Box>
        </RightPane>
      </Wrapper>
    </div>
  );
}

export default HomePage;
