import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  EpisodeLink, DetailsCard,
  CardBody, EpisodeImage, EpisodeImageStyle,
  Content, PodcastDetails,
  TimeBadge, TimeIcon, CalenderIcon,
} from './episode-details-elements';

dayjs.extend(relativeTime);
function EpisodeDetails({
  title, url, publishedAt, imageUrl,
}) {
  return (
    <EpisodeLink href={url}>
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
}

EpisodeDetails.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  publishedAt: PropTypes.instanceOf(Date),
  imageUrl: PropTypes.string,
  categories: PropTypes.arrayOf(PropTypes.string),
  keywords: PropTypes.arrayOf(PropTypes.string),
};

EpisodeDetails.defaultProps = {
  publishedAt: null,
  imageUrl: null,
  categories: [],
  keywords: [],
};

export default EpisodeDetails;
