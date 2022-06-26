import React from 'react';
import { Modal, Button, Image } from 'react-bootstrap';
import style from 'PodcastDetails.module.scss';
import { Box } from '@mui/material';
import { Episode } from '../client/interfaces';
import EpisodeDetails from './episode-details';

// const EpisodeList = styled.ol`
//   list-style: none;
//   display: flex;
//   flex-direction: column;
//   margin-top: 0;
//   margin-bottom: 0;
//   padding-left: 0;
// `;

// const PodImage = styled(Image)`
//   border-radius: 1rem;
//   margin-bottom: 2px;
// `;

interface Props {
  title: string,
  close: () => void,
  isOpen?: boolean,
  description?: string,
  imageUrl?: string,
  imageTitle?: string,
  episodes?: Episode[],
}

const PodcastDetails : React.FC<Props> = ({
  close,
  title,
  description,
  imageUrl,
  imageTitle,
  isOpen = false,
  episodes = [],
}) => (
  <Modal show={isOpen} onHide={close} animation centered scrollable backdrop="static">
    <Modal.Header>{title}</Modal.Header>
    <Modal.Body>
      {description && (
      <p>{description}</p>
      )}
      {imageUrl && (
      <Image className={style['pod-image']} src={imageUrl} alt={imageTitle} fluid />
      )}
      <Box component="ol" className={style['episode-list']}>
        {episodes.slice()
          .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        // TODO: specify explicit props instead of ...episode
        //       use `imageUrl` instead of `episode.imageUrl` if the latter is invalid
          .map(episode => (
            <EpisodeDetails key={episode.title} {...episode} />
          ))}
      </Box>
    </Modal.Body>
    <Modal.Footer>
      <Button type="button" variant="warning" onClick={close}>Close</Button>
    </Modal.Footer>
  </Modal>
);

export default PodcastDetails;
