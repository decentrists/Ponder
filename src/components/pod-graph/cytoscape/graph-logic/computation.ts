import { EdgeDefinition, NodeDefinition } from 'cytoscape';
import { v4 as uuid } from 'uuid';
import { Podcast } from '../../../../client/interfaces';
import {
  findSharedCategoriesAndKeywords, haveSharedElements,
  haveSharedKeywords,
  removeDuplicateElements,
  SharedKeywords,
} from './utils';

export interface DisjointGraphNode extends Pick<Podcast, 'subscribeUrl'> {
  keywordsAndCategories: string[];
  visited: boolean;
}

export interface DisjointGraph {
  nodes: DisjointGraphNode[],
  sharedKeywordsAndCategories: SharedKeywords[]
}

export const countSharedKeywords = (keywords: string[], currentKeywords: SharedKeywords[] = []) => {
  let result = [...currentKeywords];
  keywords.forEach(keyword => {
    const item = result.find(el => el.name === keyword);
    if (!item) result = [...result, { name: keyword, count: 1 }];
    else item.count += 1;
  });
  return result;
};

/**
 * @param nodes
 * @param disjointGraphs The intermediate result through recursion
 * @returns
 *   An array of graph representations grouped by shared keywords & categories
 */
export const findAllDisjointGraphs = (
  nodes: DisjointGraphNode[],
  disjointGraphs : DisjointGraph[] = [],
) : DisjointGraph[] => {
  const firstUnvisitedNode = nodes.find(item => item.visited !== true);
  if (!firstUnvisitedNode) return disjointGraphs;

  firstUnvisitedNode.visited = true;
  let sharedKeywordsAndCategories = countSharedKeywords(firstUnvisitedNode.keywordsAndCategories);

  const graph = [firstUnvisitedNode];
  let relatedPodcast;
  do {
    // eslint-disable-next-line no-loop-func, @typescript-eslint/no-loop-func
    relatedPodcast = nodes.find(item => item.visited !== true
        && haveSharedKeywords(sharedKeywordsAndCategories, item.keywordsAndCategories));
    if (!relatedPodcast) break;

    relatedPodcast.visited = true;
    sharedKeywordsAndCategories = countSharedKeywords(
      relatedPodcast.keywordsAndCategories,
      sharedKeywordsAndCategories,
    );
    graph.push(relatedPodcast);
  } while (relatedPodcast);

  disjointGraphs.push({ nodes: graph, sharedKeywordsAndCategories });

  return findAllDisjointGraphs(nodes, disjointGraphs);
};

/**
 * @param subscriptions
 * @param disjointGraphs
 * @returns The findAllDisjointGraphs result mapped onto the subscriptions metadata
 */
const finalizeDisjointGraphsObject = (
  subscriptions: Podcast[],
  disjointGraphs:DisjointGraph[],
) => disjointGraphs
  .map(graph => graph.nodes
    .map(node => subscriptions
      .find(subscription => subscription.subscribeUrl === node.subscribeUrl)!));

/**
 * @param subscriptions
 * @returns An array of graphs grouped by shared keywords & categories,
 *   where each graph comprises an array of subscription metadata (nodes)
 */
export const groupSubscriptionsBySharedKeywords = (subscriptions: Podcast[]) => {
  const nodes = subscriptions.map(subscription => ({
    subscribeUrl: subscription.subscribeUrl,
    keywordsAndCategories: removeDuplicateElements([
      ...(subscription.keywords || []),
      ...(subscription.categories || []),
    ]),
    visited: false,
  }));
  const disjointGraphs = findAllDisjointGraphs(nodes);
  const podcasts = finalizeDisjointGraphsObject(subscriptions, disjointGraphs);
  return { podcasts, disjointGraphs };
};

export const generateNodes = (disjointGraphs: Podcast[][]) => {
  const nodes : NodeDefinition[] = [];

  disjointGraphs.forEach(graph => {
    const id = uuid();
    const compoundNode = {
      group: 'nodes' as const,
      data: {
        id,
      },
      classes: 'customGroup',
    };
    nodes.push(compoundNode);
    nodes.push(...graph.map(podcast => ({
      group: 'nodes' as const,
      classes: 'customNodes',
      data: {
        id: podcast.subscribeUrl,
        label: podcast.title,
        categories: podcast.categories || [],
        keywords: podcast.keywords || [],
        episodes: podcast.episodes,
        description: podcast.description,
        title: podcast.title,
        imageUrl: podcast.imageUrl,
        imageTitle: podcast.title,
        parent: id,
      },
    })));
  });

  return nodes;
};

const getKeywordScore = (
  keywords: SharedKeywords[],
  keyword: string,
) => keywords.find(element => element.name === keyword)!.count;

/**
 * @see https://phab.decentapps.eu/T243
 */
export const computeEdgeWeight = (
  disjointGraphs: DisjointGraph[],
  sourceId: string,
  targetId: string,
) => {
  let target! : DisjointGraphNode; let source! : DisjointGraphNode; let
    graph!: DisjointGraph;
  for (const item of disjointGraphs) {
    const sourceIndex = item.nodes.findIndex(node => node.subscribeUrl === sourceId);
    const targetIndex = item.nodes.findIndex(node => node.subscribeUrl === targetId);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      source = item.nodes[sourceIndex];
      target = item.nodes[targetIndex];
      graph = item;
      break;
    }
  }
  if (!source || !target || !graph) throw new Error('Incorrect source or target id');
  const sourceScore = source.keywordsAndCategories
    .reduce((acc, keyword) => acc + getKeywordScore(graph.sharedKeywordsAndCategories, keyword), 0);

  const targetScore = target.keywordsAndCategories
    .reduce((acc, keyword) => acc + getKeywordScore(graph.sharedKeywordsAndCategories, keyword), 0);

  const totalScore = graph.sharedKeywordsAndCategories
    .reduce((acc, keyword) => acc + getKeywordScore(
      graph.sharedKeywordsAndCategories,
      keyword.name,
    ), 0);

  return (sourceScore + targetScore) / totalScore;
};

export const generateEdges = (podcasts: Podcast[][], disjointGraphs: DisjointGraph[]) => {
  const eachDisjointGraphEdges = podcasts.map(graph => graph
    .reduce((acc: EdgeDefinition[], podcast, _, arrayReference) => {
      // A match is any other podcast that has one same category or keyword
      let matches = arrayReference.filter(({ categories, keywords }) => (
        haveSharedElements(podcast.categories, categories)
          || haveSharedElements(podcast.keywords, keywords)
      ));

      // remove loops (edge from a node to itself)
      matches = matches.filter(match => match.subscribeUrl !== podcast.subscribeUrl);

      const result = matches.map(match => {
        const relations = findSharedCategoriesAndKeywords(podcast, match);
        const edge = {
          source: podcast.subscribeUrl,
          target: match.subscribeUrl,
          label: relations.join('\n'),
          weight: computeEdgeWeight(disjointGraphs, podcast.subscribeUrl, match.subscribeUrl),
        };
        return { data: edge };
      });

      return [...acc, ...result];
    }, [])
  // remove duplicate edges since the graph is undirected.
    .reduce((acc: EdgeDefinition[], edge) => (
      acc.some(item => item.data.target === edge.data.source
         && item.data.source === edge.data.target)
        ? acc
        : acc.concat(edge)
    ), []));

  const edges = eachDisjointGraphEdges.reduce((acc, curr) => [...acc, ...curr], []);

  return edges;
};
