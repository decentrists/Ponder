import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Tabs, Tab,
} from '@mui/material';
import { SubscriptionsContext } from '../providers/subscriptions';
import { ArweaveContext } from '../providers/arweave';
import PodGraph from '../components/pod-graph';
import HeaderComponent from '../components/layout/header-component';
import CategoriesList from '../components/categories-list';
import PodcastList from '../components/podcast-list';
import TransactionList from '../components/transaction-list';
import style from './home.module.scss';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  className?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, className, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      className={className}
      {...other}
    >
      <Box>{children}</Box>
    </div>
  );
}

function HomePage() {
  const { subscriptions, subscribe, unsubscribe } = useContext(SubscriptionsContext);
  const { arSyncTxs, isSyncing, removeArSyncTxs } = useContext(ArweaveContext);

  const [tab, setTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  useEffect(() => {
    if (isSyncing) setTab(1);
  }, [isSyncing]);

  async function search({ query } : { query: string }) {
    subscribe(query);
  }
  return (
    <div className={style.container}>
      <HeaderComponent onSubmit={search} />

      {subscriptions && (
        <PodGraph subscriptions={subscriptions} />
      )}

      <Box className={style.wrapper}>
        <Box className={style.leftPane}>
          <CategoriesList categories={[]} />
        </Box>
        <Box className={style.rightPane}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs onChange={handleChange} value={tab} aria-label="Info tabs">
              <Tab className={style.tabHeader} label="Subscriptions" />
              <Tab className={style.tabHeader} label="Transactions" />
            </Tabs>
          </Box>

          <TabPanel className={style['tab-panel']} value={tab} index={0}>
            <PodcastList subscriptions={subscriptions} unsubscribe={unsubscribe} />
          </TabPanel>

          <TabPanel className={style['tab-panel']} value={tab} index={1}>
            <TransactionList
              subscriptions={subscriptions}
              txs={arSyncTxs}
              removeArSyncTxs={removeArSyncTxs}
            />
          </TabPanel>
        </Box>
      </Box>
    </div>
  );
}

export default HomePage;
