import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import RemoveBtn from './buttons/remove-button';
import {
  ArSyncTx,
  ArSyncTxStatus,
  statusToString,
} from '../client/arweave/sync';
import {
  ListContainer, ListItem,
  TitleDetail, TitleHeader,
  PodcastImage, MetaDetail,
  CallToAction, ActionInfo, ActionBtn,
} from './shared-elements';
import { episodesCount, findMetadata } from '../utils';
import { Podcast } from '../client/interfaces';

dayjs.extend(relativeTime);

interface Props {
  subscriptions: Podcast[];
  txs: ArSyncTx[];
  removeArSyncTxs: (txIds?: string[]) => void;
}

const TransactionList : React.FC<Props> = ({ subscriptions, txs, removeArSyncTxs }) => {
  const findImageUrl = (subscribeUrl: string) => {
    const cachedPodcast = findMetadata(subscribeUrl, subscriptions);
    return cachedPodcast.imageUrl || ''; // TODO: replace '' with default Ponder logo
  };

  const completedTxIds = txs
    .filter(tx => tx.status !== ArSyncTxStatus.INITIALIZED && tx.status !== ArSyncTxStatus.POSTED)
    .map(tx => tx.id);

  return (
    <ListContainer>
      { txs.length ? (
        <div>
          <ListItem key={'total-txs'}>
            <TitleDetail />
            <CallToAction>
              <ActionInfo>
                {`total: ${txs.length}`}
              </ActionInfo>
              <ActionBtn>
                <RemoveBtn onClick={() => removeArSyncTxs()} />
              </ActionBtn>
            </CallToAction>
          </ListItem>

          <ListItem key={'completed-txs'}>
            <TitleDetail />
            <CallToAction>
              <ActionInfo>
                {`completed: ${completedTxIds.length}`}
              </ActionInfo>
              <ActionBtn>
                <RemoveBtn onClick={() => removeArSyncTxs(completedTxIds)} />
              </ActionBtn>
            </CallToAction>
          </ListItem>

          {
            [...txs].reverse().map(tx => {
              const image = findImageUrl(tx.subscribeUrl);
              const numEpisodes = episodesCount(tx.metadata);
              const TxSubheader = () => numEpisodes ? (
                <MetaDetail>
                  {`${numEpisodes} episodes`}
                </MetaDetail>
              ) : null;

              // TODO: add viewblock.io tx url
              return (
                <ListItem key={tx.id}>
                  <TitleDetail>
                    <PodcastImage src={image} alt={tx.title} />
                    <div>
                      <TitleHeader>
                        {tx.title}
                      </TitleHeader>
                      <TxSubheader />
                    </div>
                  </TitleDetail>

                  <CallToAction>
                    <ActionInfo>
                      {statusToString(tx.status)}
                    </ActionInfo>
                    <ActionBtn>
                      <RemoveBtn onClick={() => removeArSyncTxs([tx.id])} />
                    </ActionBtn>

                  </CallToAction>
                </ListItem>

              );
            })
          }
        </div>
      ) : <ListItem>No active transactions.</ListItem>
    }
    </ListContainer>
  );
};

export default TransactionList;
