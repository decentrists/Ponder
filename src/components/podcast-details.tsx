import React from 'react';
import styled from 'styled-components';
import { Episode } from '../client/interfaces';
import { Modal, Button, Image } from 'react-bootstrap';
import EpisodeDetails from './episode-details';

const EpisodeList = styled.ol`
  list-style: none;
  display: flex;
  flex-direction: column;
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 0;
`;

const PodImage = styled(Image)`
  border-radius: 1rem;
  margin-bottom: 2px;
`;

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
          <PodImage src={imageUrl} alt={imageTitle} fluid />
        )}
        <EpisodeList>
          {episodes.slice()
            .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
            // TODO: specify explicit props instead of ...episode
            //       use `imageUrl` instead of `episode.imageUrl` if the latter is invalid
            .map(episode => (
              <EpisodeDetails key={episode.title} {...episode} />
            ))}
        </EpisodeList>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="warning" onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
);

export default PodcastDetails;
