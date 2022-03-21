import client from './client';
import { toTag } from './utils';
import { unixTimestamp, toISOString } from '../../utils';

async function sendTransaction(wallet, newEpisodes, tags) {
  const trx = await client.createTransaction({ data: JSON.stringify(newEpisodes) }, wallet);
  trx.addTag('Content-Type', 'application/json');
  trx.addTag('Unix-Time', unixTimestamp());
  trx.addTag(toTag('version'), process.env.VERSION);
  tags.forEach(([k, v]) => {
    trx.addTag(toTag(k), v);
  });

  await client.transactions.sign(trx, wallet);
  return client.transactions.post(trx);
}

export async function postPodcastMetadata(wallet, newEpisodes, {
  keywords,
  categories,
  subscribeUrl,
  ...podcast
}) {
  const podcastTags = [
    ['subscribeUrl', subscribeUrl],
    ['title', podcast.title],
    ['description', podcast.description],
    ...categories.map(category => ['category', category]),
    ...keywords.map(keyword => ['keyword', keyword]),
  ];
  const episodeBatchTags = episodeTags(podcast, newEpisodes);

  return sendTransaction(wallet, newEpisodes, podcastTags.concat(episodeBatchTags));
}

/**
 * @return {[[string, string]]} The metadata transaction tags for the given list of newEpisodes
 */
async function episodeTags(podcast, newEpisodes) {
  if (!newEpisodes.length) { return []; }

  const firstEpisodeDate = newEpisodes[0].publishedAt;
  const lastEpisodeDate = newEpisodes[newEpisodes.length - 1].publishedAt;
  const metadataBatch = getMetadataBatchNumber(podcast, firstEpisodeDate, lastEpisodeDate);

  return [
    ['firstEpisodeDate', toISOString(firstEpisodeDate)],
    ['lastEpisodeDate', toISOString(lastEpisodeDate)],
    ['metadataBatch', String(metadataBatch)],
  ];
}

async function getMetadataBatchNumber(podcast, firstEpisodeDate, lastEpisodeDate) {
  if (!(firstEpisodeDate instanceof Date && lastEpisodeDate instanceof Date)) {
    throw new Error(`Could not upload metadata for ${podcast.title}: ` +
                    'Invalid date found for one of its episodes.');
  }

  /* First metadata batch for this podcast */
  if (!podcast.firstBatch || !podcast.currentBatch) {
    return 0;
  }

  /* Retroactive inserting of metadata */
  if (podcast.firstBatch.firstEpisodeDate >= lastEpisodeDate) {
    return podcast.firstBatch.count - 1;
  }

  if (podcast.currentBatch &&
      podcast.currentBatch.lastEpisodeDate > lastEpisodeDate) {
    // return queryMiddleMetadataBatchNumber(podcast, firstEpisodeDate, lastEpisodeDate);
    throw new Error('Supplementing existing metadata is not supported yet.');
  }

  /* Next consecutive metadata batch */
  return podcast.currentBatch + 1;
}
