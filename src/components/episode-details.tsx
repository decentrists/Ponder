import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Box, Link } from '@mui/material';
import { MdMoreTime, MdOutlineCloudUpload } from 'react-icons/md';
import { Image } from 'react-bootstrap';
import style from './EpisodeDetailsElements.module.scss';

dayjs.extend(relativeTime);

interface Props {
  title: string,
  publishedAt: Date,
  mediaUrl?: string,
  imageUrl?: string,
}
const EpisodeDetails : React.FC<Props> = ({
  title, publishedAt, mediaUrl, imageUrl,
}) => (
  <Link className={style['episode-link']} href={mediaUrl}>
    <Box className={style['details-card']}>
      <Box className={style['card-body']}>
        <Box className={style['episode-image']}>
          <Image className={style['episode-image-style']} src={imageUrl} alt={title} fluid />
        </Box>
        <Box className={style.content}>
          <h5>{title}</h5>
          <Box style={style['podcast-details']}>
            <Box component="small" className={style['time-badge']}>
              <MdMoreTime className={style['time-icon']} />
              1hr 30min
            </Box>
            <Box component="small" className={style['time-badge']}>
              <MdOutlineCloudUpload className={style['calendar-icon']} />
              {dayjs(publishedAt).fromNow()}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  </Link>
);

export default EpisodeDetails;
