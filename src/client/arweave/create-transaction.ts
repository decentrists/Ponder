import { JWKInterface } from 'arweave/node/lib/wallet';
import Transaction from 'arweave/node/lib/transaction';
import { strToU8, compressSync } from 'fflate';
import client from './client';
import { toTag } from './utils';
import {
  unixTimestamp,
  toISOString,
  isNotEmpty,
  hasMetadata,
  isValidDate,
  isValidInteger,
} from '../../utils';
import {
  Episode,
  Podcast,
  MANDATORY_ARWEAVE_TAGS,
  OPTIONAL_ARWEAVE_STRING_TAGS,
} from '../interfaces';

type MandatoryTags = typeof MANDATORY_ARWEAVE_TAGS[number];

async function newTransaction(
  wallet: JWKInterface,
  newMetadata: Partial<Podcast>,
  tags: [string, string][] = [],
)
  : Promise<Transaction> {
  try {
    const u8data = strToU8(JSON.stringify(newMetadata));
    const gzippedData = compressSync(u8data, { level: 6, mem: 4 });
    const trx = await client.createTransaction({ data: gzippedData }, wallet);

    trx.addTag('App-Name', process.env.REACT_APP_TAG_PREFIX as string);
    trx.addTag('App-Version', process.env.REACT_APP_VERSION as string);
    trx.addTag('Content-Type', 'application/gzip');
    trx.addTag('Unix-Time', `${unixTimestamp()}`);
    tags.forEach(([k, v]) => {
      trx.addTag(toTag(k), `${v}`);
    });
    return trx;
  }
  catch (ex) {
    console.error(ex);
    throw new Error('Creating transaction failed; please try reloading your wallet.');
  }
}

/**
 * @param trx The Arweave Transaction to be signed and posted
 * @param wallet
 * @returns `trx` if signed and posted successfully
 * @throws if signing or posting fails
 */
export async function signAndPostTransaction(trx: Transaction, wallet: JWKInterface)
  : Promise<Transaction> {
  let postResponse;
  try {
    await client.transactions.sign(trx, wallet); // has no return value
    postResponse = await client.transactions.post(trx);
  }
  catch (ex) {
    console.error(ex);
    if (!postResponse) {
      throw new Error('Signing transaction failed; please try reloading your wallet.');
    }
    throw new Error('Posting transaction failed; please try reloading your wallet.');
  }

  if (isNotEmpty(postResponse.data.error)) {
    throw new Error(`${postResponse.data.error.code}. Posting transaction failed: `
      + `${postResponse.data.error.msg}`);
  }
  return trx;
}

/**
 * @param wallet
 * @param newMetadata Assumed to already be a diff vs `cachedMetadata`
 * @param cachedMetadata
 * @returns a new Arweave Transaction object
 * @throws if `newMetadata` is incomplete or if newTransaction() throws
 */
export async function newMetadataTransaction(
  wallet: JWKInterface,
  newMetadata: Partial<Podcast>,
  cachedMetadata : Partial<Podcast> = {},
) : Promise<Transaction> {
  const mandatoryPodcastTags : [MandatoryTags, string | undefined][] = [
    ['subscribeUrl', newMetadata.subscribeUrl || cachedMetadata.subscribeUrl],
    ['title', newMetadata.title || cachedMetadata.title],
    ['description', newMetadata.description || cachedMetadata.description],
  ];

  const getMandatoryTagsValues = (key: MandatoryTags) => mandatoryPodcastTags
    .find(element => element[0] === key)![1];

  mandatoryPodcastTags.forEach(([name, value]) => {
    if (!value) {
      throw new Error('Could not upload metadata for '
        + `${getMandatoryTagsValues('title') || getMandatoryTagsValues('subscribeUrl')}: `
        + `${name} is missing`);
    }
  });

  const podcastTags = [...mandatoryPodcastTags] as [string, string][];
  OPTIONAL_ARWEAVE_STRING_TAGS.forEach(tagName => {
    const val = newMetadata[tagName as keyof Podcast] as string;
    if (val) podcastTags.push([tagName, val]);
  });

  // Add new categories and keywords in string => string format
  (newMetadata.categories || []).forEach(cat => podcastTags.push(['category', cat]));
  (newMetadata.keywords || []).forEach(key => podcastTags.push(['keyword', key]));
  (newMetadata.episodesKeywords || []).forEach(key => podcastTags.push(['episodesKeyword', key]));

  const episodeBatchTags = episodeTags(
    newMetadata.episodes,
    cachedMetadata,
    newMetadata.metadataBatch,
  );

  return newTransaction(wallet, newMetadata, podcastTags.concat(episodeBatchTags));
}

/**
 * @param newEpisodes
 * @param cachedMetadata
 * @param metadataBatchNumber Iff null then metadataBatch is computed by @see getMetadataBatchNumber
 * @returns The metadata transaction tags for the given list of newEpisodes
 */
function episodeTags(
  newEpisodes : Episode[] = [],
  cachedMetadata : Partial<Podcast> = {},
  metadataBatchNumber : number | null = null,
) : [string, string][] {
  if (!newEpisodes.length) { return []; }

  const firstEpisodeDate = newEpisodes[newEpisodes.length - 1].publishedAt;
  const lastEpisodeDate = newEpisodes[0].publishedAt;
  const metadataBatch = (isValidInteger(metadataBatchNumber) ? metadataBatchNumber
    : getMetadataBatchNumber(cachedMetadata, firstEpisodeDate, lastEpisodeDate));

  return [
    ['firstEpisodeDate', toISOString(firstEpisodeDate)],
    ['lastEpisodeDate', toISOString(lastEpisodeDate)],
    ['metadataBatch', `${metadataBatch}`],
  ];
}

/**
 * @param cachedMetadata
 * @param firstNewEpisodeDate
 * @param lastNewEpisodeDate
 * @returns
 *   An integer denoting the batch number for the [firstNewEpisodeDate, lastNewEpisodeDate] interval
 */
export function getMetadataBatchNumber(
  cachedMetadata : Partial<Podcast>,
  firstNewEpisodeDate: Date,
  lastNewEpisodeDate: Date,
) : number {
  if (!isValidDate(firstNewEpisodeDate) || !isValidDate(lastNewEpisodeDate)) {
    throw new Error(`Could not upload metadata for ${cachedMetadata.title}: `
                    + 'Invalid date found for one of its episodes.');
  }
  const cachedBatchNumber = cachedMetadata.metadataBatch;

  /* First metadata batch for this podcast */
  if (!hasMetadata(cachedMetadata) || !isValidInteger(cachedBatchNumber)) {
    return 0;
  }

  /* Retroactive inserting of metadata */
  // if (cachedMetadata.firstBatch.firstEpisodeDate >= lastNewEpisodeDate) {
  //   return cachedMetadata.firstBatch.count - 1;
  // }

  if (cachedMetadata.lastEpisodeDate
    && cachedMetadata.lastEpisodeDate > lastNewEpisodeDate) {
    // return queryMiddleMetadataBatchNumber(cachedMetadata,firstNewEpisodeDate,lastNewEpisodeDate);
    throw new Error('Supplementing existing metadata is not implemented yet.');
  }

  /* Next consecutive metadata batch */
  return cachedBatchNumber + 1;
}
