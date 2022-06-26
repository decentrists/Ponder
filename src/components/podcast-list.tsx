import React from 'react';
import { RiMapPinTimeLine } from 'react-icons/ri';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Image } from 'react-bootstrap';
import { Box, Typography } from '@mui/material';
import style from './shared-elements.module.scss';
import RemoveBtn from './buttons/remove-button';
import { Podcast } from '../client/interfaces';

dayjs.extend(relativeTime);

interface Props {
  subscriptions: Podcast[];
  unsubscribe: (id: string) => void;
}

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
                <Typography component="h5" className={style['title-header']}>
                  {subscription.title}
                </Typography>
                <Box className={style['meta-detail']}>
                  <Box className={style['latest-release']}>
                    <RiMapPinTimeLine />
                    <Box component="small" className={style['time-release']}>
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
