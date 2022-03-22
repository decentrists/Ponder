import client from './client';
import { toTag } from './utils';
import { unixTimestamp } from '../../utils';

async function sendTransaction(wallet, contents, tags) {
  const trx = await client.createTransaction({ data: JSON.stringify(contents) }, wallet);
  trx.addTag('Content-Type', 'application/json');
  trx.addTag('Unix-Time', unixTimestamp());
  trx.addTag(toTag('version'), process.env.VERSION);
  tags.forEach(([k, v]) => {
    trx.addTag(toTag(k), v);
  });

  await client.transactions.sign(trx, wallet);
  return client.transactions.post(trx);
}

export async function createPodcast(wallet, {
  keywords,
  categories,
  subscribeUrl,
  ...podcast
}) {
  return sendTransaction(wallet, podcast, [
    ['subscribeUrl', subscribeUrl],
    ['title', podcast.title],
    ['description', podcast.description],
    ...categories.map(category => ['category', category]),
    ...keywords.map(keyword => ['keyword', keyword]),
  ]);
}

export async function createEpisodes(
  wallet,
  podcastSubscribeUrl,
  episodes,
  prevCount = 0,
) {
  return sendTransaction(wallet, episodes, [
    ['subscribeUrl', podcastSubscribeUrl],
    ['count', prevCount + episodes.length],
  ]);
}
