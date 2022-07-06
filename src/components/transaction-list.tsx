import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Box } from '@mui/material';
import { Image } from 'react-bootstrap';
import RemoveBtn from './buttons/remove-button';
import {
  ArSyncTx,
  isNotInitialized,
  isNotPosted,
  statusToString,
} from '../client/arweave/sync';
import style from './shared-elements.module.scss';
import { episodesCount, findMetadata } from '../utils';
import { Podcast } from '../client/interfaces';
import { ReactComponent as WhalephantIcon } from '../assets/ponder-logo.svg';

dayjs.extend(relativeTime);

interface Props {
  subscriptions: Podcast[];
  txs: ArSyncTx[];
  removeArSyncTxs: (ids?: string[] | null) => void;
}

function TxSubheader({ numEpisodes } : { numEpisodes: number }) {
  return numEpisodes ? (
    <Box className={style['meta-detail']}>
      {`${numEpisodes} episodes`}
    </Box>
  ) : null;
}

function PodcastImage({ podcastImageUrl } : { podcastImageUrl: string }) {
  return podcastImageUrl ? <Image className={style['podcast-image']} src={podcastImageUrl} /> : (
    <Box className={style['podcast-image-whalephant']}>
      <WhalephantIcon />
    </Box>
  );
}

const TransactionList : React.FC<Props> = ({ subscriptions, txs, removeArSyncTxs }) => {
  const findImageUrl = (subscribeUrl: string) => {
    const cachedPodcast = findMetadata(subscribeUrl, subscriptions);
    return cachedPodcast.imageUrl || '';
  };

  const completedTxIds = txs.filter(tx => isNotInitialized(tx) && isNotPosted(tx)).map(tx => tx.id);

  return (
    <Box className={style['list-container']}>
      { txs.length ? (
        <div>
          <Box className={style['list-item']} key="total-txs">
            <Box className={style['title-detail']} />
            <Box className={style['call-to-action']}>
              <Box className={style['action-info']}>
                {`total: ${txs.length}`}
              </Box>
              <Box className={style['action-btn']}>
                <RemoveBtn onClick={() => removeArSyncTxs()} />
              </Box>
            </Box>
          </Box>

          <Box className={style['list-item']} key="completed-txs">
            <Box className={style['title-detail']} />
            <Box className={style['call-to-action']}>
              <Box className={style['action-info']}>
                {`completed: ${completedTxIds.length}`}
              </Box>
              <Box className={style['action-btn']}>
                <RemoveBtn onClick={() => removeArSyncTxs(completedTxIds)} />
              </Box>
            </Box>
          </Box>
          {
            [...txs].reverse().map(tx => {
              const podcastImageUrl = findImageUrl(tx.subscribeUrl);
              const numEpisodes = episodesCount(tx.metadata);

              // TODO: add viewblock.io tx url
              return (
                <Box className={style['list-item']} key={tx.id}>
                  <Box className={style['title-detail']}>
                    <PodcastImage podcastImageUrl={podcastImageUrl} />

                    <div>
                      <Box className={style['title-header']}>
                        {tx.title}
                      </Box>
                      <TxSubheader numEpisodes={numEpisodes} />
                    </div>
                  </Box>

                  <Box className={style['call-to-action']}>
                    <Box className={style['action-info']}>
                      {statusToString(tx.status)}
                    </Box>
                    <Box className={style['action-btn']}>
                      <RemoveBtn onClick={() => removeArSyncTxs([tx.id])} />
                    </Box>
                  </Box>
                </Box>

              );
            })
          }
        </div>
      ) : <Box className={style['list-item']}>No active transactions.</Box>}
    </Box>
  );
};

export default TransactionList;
