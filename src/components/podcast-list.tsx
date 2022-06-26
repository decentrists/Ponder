import React from 'react';
import styled from 'styled-components';
import { RiMapPinTimeLine } from 'react-icons/ri';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
// import {
//   ListContainer, ListItem, TitleDetail,
//   TitleHeader, PodcastImage,
//   MetaDetail, ActionBtn, CallToAction,
// } from './shared-elements';
import { Image } from 'react-bootstrap';
import style from 'PodcastList.module.scss';
import { Box } from '@mui/material';
import RemoveBtn from './buttons/remove-button';
import { Podcast } from '../client/interfaces';

dayjs.extend(relativeTime);

interface Props {
  subscriptions: Podcast[];
  unsubscribe: (id: string) => void;
}

// const LatestRelease = styled.div`
//   margin-right: 2rem;
//   display: flex;
//   align-items: center;
//   color: rgba(104, 104, 104, 1);
//   font-size: 12px;
// `;

// const TimeRelease = styled.small`
//   font-size: 9px;
//   margin-top: 1px;
//   text-transform: capitalize;
//   color: rgba(104, 104, 104, 1);
//   line-height: 1rem;
// `;

const PodcastList : React.FC<Props> = ({ subscriptions, unsubscribe }) => (
  <Box className={style['list-container']}>
    { subscriptions.length ? (
      <div>
        {subscriptions.map(subscription => (
          <Box className={style['list-item']} key={subscription.subscribeUrl}>
            <Box className={style['title-detail']}>
              <Image
                className={style['podcast-image']}
                src={subscription.imageUrl}
                alt={subscription.title}
              />
              <div>
                <Box component="h5" className={style['title-header']}>
                  {subscription.title}
                </Box>
                <Box className={style['meta-detail']}>
                  <Box className={style['latest-release']}>
                    <RiMapPinTimeLine />
                    <Box className={style['time-release']}>
                      {dayjs(subscription.firstEpisodeDate).fromNow()}
                    </Box>

                  </Box>
                </Box>
              </div>
            </Box>

            <Box className={style['call-to-action']}>
              <Box className={style['action-btn']}>
                <RemoveBtn onClick={() => unsubscribe(subscription.subscribeUrl)} />
              </Box>
            </Box>
          </Box>
        ))}
      </div>
    ) : (
      <Box className={style['list-item']}>There are no podcasts to display&hellip;</Box>
    )}
  </Box>
);

export default PodcastList;
