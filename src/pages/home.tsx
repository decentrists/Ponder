import React, { useContext } from 'react';
import {
  Box, Tabs, Tab,
} from '@mui/material';
import { SubscriptionsContext } from '../providers/subscriptions';
import { ArweaveContext } from '../providers/arweave';
import PodGraph from '../components/pod-graph';
import HeaderComponent from '../components/layout/header-component';
import {
  EventWrapper, LeftPane, RightPane,
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
  const [tab, setTab] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const tabProps = (index: number) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  };

  // TODO: every time we switch tabs, the podcast images (some 3000x3000) are reloaded;
  //       perhaps use `visibility` class instead of `hidden` prop
  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  async function search({ query } : { query: string }) {
    subscribe(query);
  }

  return (
    <div>
      <HeaderComponent onSubmit={search} />

      {subscriptions && (
        <PodGraph subscriptions={subscriptions} />
      )}

      <EventWrapper>
        <LeftPane>
          <CategoriesList categories={[]} />
        </LeftPane>
        <RightPane>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tab}
                onChange={handleTabChange}
                aria-label='Info tabs'
              >
                <Tab label='Subscriptions' {...tabProps(0)} />
                <Tab label='Transactions' {...tabProps(1)} />
              </Tabs>
            </Box>
            <TabPanel value={tab} index={0}>
              <PodcastList subscriptions={subscriptions} unsubscribe={unsubscribe} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <TransactionList
                subscriptions={subscriptions}
                txs={arSyncTxs}
                removeArSyncTxs={removeArSyncTxs}
              />
            </TabPanel>
          </Box>
        </RightPane>
      </EventWrapper>
    </div>
  );
}

export default HomePage;
