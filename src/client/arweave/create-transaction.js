import client from './client';
import { toTag } from './utils';
import { unixTimestamp, toISOString, isEmpty } from '../../utils';

async function sendTransaction(wallet, newMetadata, tags) {
  const trx = await client.createTransaction({ data: JSON.stringify(newMetadata) }, wallet);
  trx.addTag('Content-Type', 'application/json');
  trx.addTag('Unix-Time', unixTimestamp());
  trx.addTag(toTag('version'), process.env.VERSION);
  tags.forEach(([k, v]) => {
    trx.addTag(toTag(k), `${v}`);
  });

  await client.transactions.sign(trx, wallet);
  return client.transactions.post(trx);
}

export async function postPodcastMetadata(wallet, newMetadata, cachedMetadata) {
  const optionalPodcastTags = [
    // imgUrl and imageTitle are optional metadata as well, but these do not belong in the tags,
    // as they do not have to be GraphQL-searchable.
    'language',
  ];
  const mandatoryPodcastTags = [
    ['subscribeUrl', newMetadata.subscribeUrl || cachedMetadata.subscribeUrl],
    ['title', newMetadata.title || cachedMetadata.title],
    ['description', newMetadata.description || cachedMetadata.description],
  ];
  mandatoryPodcastTags.forEach(([name, value]) => {
    if (!value) {
      throw new Error('Could not upload metadata for ' +
        `${mandatoryPodcastTags.title || mandatoryPodcastTags.subscribeUrl}: ` +
        `${name} is missing`);
    }
  });

  const podcastTags = [...mandatoryPodcastTags];
  optionalPodcastTags.forEach(tagName => {
    if (newMetadata[tagName]) podcastTags.push([tagName, newMetadata[tagName]]);
  });

  // Add new categories and keywords in string => string format
  (newMetadata.categories || []).forEach(cat => podcastTags.push(['category', cat]));
  (newMetadata.keywords || []).forEach(key => podcastTags.push(['keyword', key]));

  const episodeBatchTags = episodeTags(newMetadata.episodes, cachedMetadata);

  return sendTransaction(wallet, newMetadata, podcastTags.concat(episodeBatchTags));
}

/**
 * @return {[[string, string]]} The metadata transaction tags for the given list of newEpisodes
 */
function episodeTags(newEpisodes, podcast) {
  if (!newEpisodes.length) { return []; }

  const firstEpisodeDate = newEpisodes[newEpisodes.length - 1].publishedAt;
  const lastEpisodeDate = newEpisodes[0].publishedAt;
  const metadataBatch = getMetadataBatchNumber(podcast, firstEpisodeDate, lastEpisodeDate);

  return [
    ['firstEpisodeDate', toISOString(firstEpisodeDate)],
    ['lastEpisodeDate', toISOString(lastEpisodeDate)],
    ['metadataBatch', `${metadataBatch}`],
  ];
}

function getMetadataBatchNumber(podcast, firstEpisodeDate, lastEpisodeDate) {
  if (!(firstEpisodeDate instanceof Date && lastEpisodeDate instanceof Date) ||
      !firstEpisodeDate.getTime() || !lastEpisodeDate.getTime()) {
    throw new Error(`Could not upload metadata for ${podcast.title}: ` +
                    'Invalid date found for one of its episodes.');
  }

  /* First metadata batch for this podcast */
  if (isEmpty(podcast) || Number.isNaN(podcast.metadataBatch)) {
    return 0;
  }

  /* Retroactive inserting of metadata */
  // if (podcast.firstBatch.firstEpisodeDate >= lastEpisodeDate) {
  //   return podcast.firstBatch.count - 1;
  // }

  if (podcast.metadataBatch && podcast.lastEpisodeDate > lastEpisodeDate) {
    // return queryMiddleMetadataBatchNumber(podcast, firstEpisodeDate, lastEpisodeDate);
    throw new Error('Supplementing existing metadata is not implemented yet.');
  }

  /* Next consecutive metadata batch */
  return podcast.metadataBatch + 1;
}
