import PropTypes from 'prop-types';

export const episodePropType = PropTypes.shape({
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  publishedAt: PropTypes.instanceOf(Date).isRequired,
  keywords: PropTypes.arrayOf(PropTypes.string),
  categories: PropTypes.arrayOf(PropTypes.string),
});

export const podcastPropType = PropTypes.shape({
  subscribeUrl: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  language: PropTypes.string,
  imageUrl: PropTypes.string,
  imageTitle: PropTypes.string,
  // metadataBatch: PropTypes.number,
  firstEpisodeDate: PropTypes.instanceOf(Date).isRequired,
  lastEpisodeDate: PropTypes.instanceOf(Date).isRequired,
  categories: PropTypes.arrayOf(PropTypes.string),
  keywords: PropTypes.arrayOf(PropTypes.string),
  episodes: PropTypes.arrayOf(episodePropType).isRequired,
});
