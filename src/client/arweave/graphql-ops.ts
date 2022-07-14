/* eslint-disable no-await-in-loop */
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  QueryTransactionsArgs,
  TagFilter,
  Transaction as GraphQLTransaction,
  TransactionEdge,
} from 'arlocal/bin/graphql/types.d';
import { strFromU8, decompressSync } from 'fflate';
import { Bundle, DataItem } from 'arbundles';
import client from './client';
import {
  isNotEmpty,
  hasMetadata,
  toDate,
  podcastFromDTO,
  concatMessages,
  valueToLowerCase,
} from '../../utils';
import { toTag, fromTag } from './utils';
import { mergeBatchMetadata, mergeBatchTags } from './sync/diff-merge-logic';
import {
  PodcastFeedError,
  Podcast,
  PodcastTags,
  ALLOWED_ARWEAVE_TAGS,
  BundledTxIdMapping,
} from '../interfaces';

/** Type signature accepted by the Arweave API's '/graphql' endpoint */
type GraphQLQuery = {
  query: string,
  variables: QueryTransactionsArgs,
};
type AllowedArweaveTags = typeof ALLOWED_ARWEAVE_TAGS[number];
type TagsToFilter = {
  [key: string]: string | string[];
};

const MAX_BATCHES = 100;
const MAX_GRAPHQL_NODES = 100;

/** Helper function mapping each {tag: value, ...} to [{name: tag, values: value}, ...] */
const toTagFilter = (tagsToFilter: TagsToFilter) : TagFilter[] => Object
  .entries(tagsToFilter).map(([tag, value]) => ({
    name: toTag(tag),
    values: Array.isArray(value) ? value : [value],
  }));

export async function getPodcastFeed(
  subscribeUrl: Podcast['subscribeUrl'],
) : Promise<Partial<Podcast> | PodcastFeedError> {
  const errorMessages : string[] = [];
  const metadataBatches = [];
  const tagBatches : PodcastTags[] = [];
  // TODO: negative batch numbers
  let batch = 0;
  do {
    const gqlQuery = gqlQueryForTags(
      { subscribeUrl, metadataBatch: `${batch}` },
      [QueryField.TAGS, QueryField.BUNDLEDIN],
    );
    const { errorMessage, metadata, tags } = await getPodcastFeedForGqlQuery(gqlQuery);
    if (errorMessage) errorMessages.push(errorMessage);

    if (isNotEmpty(tags)) {
      if (!hasMetadata(metadata)) {
        // Match found for this batch number, but with invalid/empty metadata
        // TODO: prioritize next trx.id with this batch number;
        //       for now, we continue to attempt the next batch number
      }
      else {
        metadataBatches.push(metadata);
        tagBatches.push(tags);
      }
    }
    else break;

    batch++;
  }
  while (batch < MAX_BATCHES);

  const mergedMetadata : Partial<Podcast> = { ...mergeBatchMetadata(metadataBatches),
    ...mergeBatchTags(tagBatches) };
  if (!hasMetadata(mergedMetadata) && errorMessages.length) {
    // Only return an errorMessage if no metadata was found, since GraphQL likely was unreachable.
    return { errorMessage: `Encountered the following errors when fetching ${subscribeUrl} `
                           + `metadata from Arweave:\n${concatMessages(errorMessages, true)}` };
  }

  return mergedMetadata;
}

// TODO: to be used in ArSync v1.5 transaction caching
export async function getPodcastFeedForTxIds(ids: string[]) {
  // TODO: expand getPodcastFeedForGqlQuery to fetchData multiple nodes
  return getPodcastFeedForGqlQuery(gqlQueryForIds(ids, [QueryField.TAGS]));
}

/**
 * Arweave API's `getData()` queries the `/tx` endpoint which only supports Layer 1 Arweave
 * transactions, not bundled transactions. In order to fetch the data contained within a bundled
 * transaction, we have to first find out the parent id.
 * @param node One of the edges resulting from a GraphQL query, representing a transaction
 * @returns The transaction id to be used with `getData()`, which if it was bundled is the parent
 *   id; otherwise simply the `node.id`.
 */
const getParentTxId = (node: GraphQLTransaction) : string => (
  isBundledTx(node) ? node.bundledIn!.id : node.id);

const isBundledTx = (node: GraphQLTransaction) => isNotEmpty(node.bundledIn) && node.bundledIn.id;

export async function getArBundledParentIds(ids: string[]) : Promise<BundledTxIdMapping> {
  const result : BundledTxIdMapping = {};
  const edges : TransactionEdge[] = (
    await getGqlResponse(gqlQueryForIds(ids, [QueryField.BUNDLEDIN]))
  )[0];

  edges.forEach(edge => {
    const { id } = edge.node;
    const parentId = getParentTxId(edge.node);
    if (id && parentId && id !== parentId) result[id] = parentId;
  });

  return result;
}

async function getGqlResponse(gqlQuery: GraphQLQuery)
  : Promise<[TransactionEdge[], string | undefined]> {
  let edges = [];
  let errorMessage;

  try {
    const response = await client.api.post('/graphql', gqlQuery);
    // console.debug('GraphQL response:', response);
    edges = response.data.data.transactions.edges;
  }
  catch (ex) {
    errorMessage = `GraphQL returned an error: ${ex}`;
    console.warn(errorMessage);
  }
  return [edges, errorMessage];
}

function unbundleData(rawBundle: Uint8Array, bundledTxId: string) : Uint8Array {
  const bundle = new Bundle(Buffer.from(rawBundle));
  const dataItems : DataItem[] = bundle.items;
  const dataItem = dataItems.find(item => item.id === bundledTxId);
  return (dataItem ? dataItem.rawData : []) as Uint8Array;
}

type GetPodcastFeedForGqlQueryReturnType = {
  errorMessage?: string;
  metadata: Podcast | {};
  tags: PodcastTags | {};
};

async function getPodcastFeedForGqlQuery(gqlQuery: GraphQLQuery)
  : Promise<GetPodcastFeedForGqlQueryReturnType> {
  let edges = [];
  let errorMessage;
  [edges, errorMessage] = await getGqlResponse(gqlQuery);

  if (errorMessage || !edges.length) return { errorMessage, metadata: {}, tags: {} };

  // TODO: We currently simply grab the newest transaction matching this `batch` nr.
  //       In the future we should fetch multiple transactions referencing the same batch and
  //       merge the result.
  const tx : GraphQLTransaction = edges[0].node;
  let tags : Partial<PodcastTags> = {};
  if (isNotEmpty(tx.tags)) {
    tags = tx.tags
      .filter(tag => ALLOWED_ARWEAVE_TAGS.includes(fromTag(tag.name) as AllowedArweaveTags))
      .map(tag => ({
        ...tag,
        name: fromTag(tag.name),
        value: (['firstEpisodeDate', 'lastEpisodeDate', 'lastBuildDate'].includes(
          fromTag(tag.name),
        ) ? toDate(tag.value) : tag.value),
      }))
      .reduce((acc, tag) => ({
        ...acc,
        [tag.name]: Array.isArray(acc[tag.name as keyof typeof acc])
          ? [...acc[tag.name as keyof typeof acc], valueToLowerCase(tag.value)]
          : tag.value,
      }), {
        categories: [],
        keywords: [],
        episodesKeywords: [],
      });
  }

  let getDataResult = new Uint8Array([]);
  try {
    // TODO: T252 Create IndexedDB cache { tx.id: { podcastMetadata, tx.tags } } for
    //       transactions that are selected for the result of getPodcastFeed(),
    //       so that we may skip this client.transactions.getData() call.
    const parentTxId = getParentTxId(tx);
    // TODO: Find a way to avoid having to fetch the entire bundled transaction, as this wastes a
    //       lot of data.
    getDataResult = await client.transactions.getData(parentTxId, { decode: true }) as Uint8Array;

    if (isBundledTx(tx)) getDataResult = unbundleData(getDataResult, tx.id);
  }
  catch (ex) {
    errorMessage = `Error fetching data for transaction id ${tx.id}: ${ex}`;
    console.warn(errorMessage);
  }
  if (errorMessage) return { errorMessage, metadata: {}, tags };

  let metadata;
  try {
    if (!getDataResult.length) {
      errorMessage = `No metadata found in transaction id ${tx.id}`;
      console.warn(errorMessage);
    }
    else {
      metadata = strFromU8(decompressSync(getDataResult));
      metadata = JSON.parse(metadata);
      metadata = podcastFromDTO(metadata, true);
    }
  }
  catch (ex) {
    // TODO: T251 blacklist trx.id
    errorMessage = `Malformed data for transaction id ${tx.id}: ${ex}`;
    console.warn(errorMessage);
  }
  if (errorMessage) return { errorMessage, metadata: {}, tags };

  // TODO: T251 sanity check podcastMetadata => reject episodes where !isValidDate(publishedAt)
  return { metadata, tags };
}

enum QueryField {
  TAGS = `
              tags {
                name
                value
              }`,
  BUNDLEDIN = `
              bundledIn {
                id
              }`,
}

/**
 * @param tagsToFilter
 * @returns An Object with the query formatted for Arweave's '/graphql' endpoint
 */
function gqlQueryForTags(tagsToFilter: TagsToFilter, queryFields: QueryField[] = [QueryField.TAGS])
  : GraphQLQuery {
  const tags = toTagFilter(tagsToFilter);

  return {
    query: `
      query GetPodcast($tags: [TagFilter!]!) {
        transactions(tags: $tags, first: ${MAX_GRAPHQL_NODES}, sort: HEIGHT_DESC) {
          edges {
            node {
              id${queryFields.join('')}
            }
          }
        }
      }
    `,
    variables: { tags },
  };
}

/**
 * @param ids
 * @param queryFields The fields of the node structure to query, besides `id`
 * @returns An Object with the query formatted for Arweave's '/graphql' endpoint
 */
function gqlQueryForIds(ids: string[], queryFields: QueryField[])
  : GraphQLQuery {
  return {
    query: `
      query GetPodcast($ids: [ID!]!) {
        transactions(ids: $ids, first: ${MAX_GRAPHQL_NODES}, sort: HEIGHT_DESC) {
          edges {
            node {
              id${queryFields.join('')}
            }
          }
        }
      }
    `,
    variables: { ids },
  };
}
