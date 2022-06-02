import React from 'react';
import styled from 'styled-components';
import { RiMapPinTimeLine } from 'react-icons/ri';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ListContainer, ListItem, TitleDetail,
  TitleHeader, PodcastImage,
  MetaDetail, ActionBtn, CallToAction,
} from './shared-elements';
import RemoveBtn from './buttons/remove-button';
import { Podcast } from '../client/interfaces';

dayjs.extend(relativeTime);

interface Props {
  subscriptions: Podcast[];
  unsubscribe: (id: string) => void;
}

const LatestRelease = styled.div`
  margin-right: 2rem;
  display: flex;
  align-items: center;
  color: rgba(104, 104, 104, 1);
  font-size: 12px;
`;

const TimeRelease = styled.small`
  font-size: 9px;
  margin-top: 1px;
  text-transform: capitalize;
  color: rgba(104, 104, 104, 1);
  line-height: 1rem;
`;

const PodcastList : React.FC<Props> = ({ subscriptions, unsubscribe }) => (
    <ListContainer>
      { subscriptions.length ? (
        <div>
          {subscriptions.map(subscription => (
            <ListItem key={subscription.subscribeUrl}>
              <TitleDetail>
                <PodcastImage src={subscription.imageUrl} alt={subscription.title} />
                <div>
                  <TitleHeader>
                    {subscription.title}
                  </TitleHeader>
                  <MetaDetail>
                    <LatestRelease>
                      <RiMapPinTimeLine />
                      <TimeRelease>
                        {dayjs(subscription.firstEpisodeDate).fromNow()}
                      </TimeRelease>

                    </LatestRelease>
                  </MetaDetail>
                </div>
              </TitleDetail>

              <CallToAction>
                <ActionBtn>
                  <RemoveBtn onClick={() => unsubscribe(subscription.subscribeUrl)} />
                </ActionBtn>
              </CallToAction>
            </ListItem>
          ))}
        </div>
      ) : (
        <ListItem>There are no podcasts to display&hellip;</ListItem>
      )}
    </ListContainer>
);

export default PodcastList;