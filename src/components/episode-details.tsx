import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  EpisodeLink, DetailsCard,
  CardBody, EpisodeImage, EpisodeImageStyle,
  Content, PodcastDetails,
  TimeBadge, TimeIcon, CalenderIcon,
} from './episode-details-elements';

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
    <EpisodeLink href={mediaUrl}>
      <DetailsCard>
        <CardBody>
          <EpisodeImage>
            <EpisodeImageStyle src={imageUrl} alt={title} fluid />
          </EpisodeImage>
          <Content>
            <h5>{title}</h5>
            <PodcastDetails>
              <TimeBadge>
                <TimeIcon />
                1hr 30min
              </TimeBadge>
              <TimeBadge>
                <CalenderIcon />
                {dayjs(publishedAt).fromNow()}
              </TimeBadge>
            </PodcastDetails>
          </Content>
        </CardBody>
      </DetailsCard>
    </EpisodeLink>
);

export default EpisodeDetails;
