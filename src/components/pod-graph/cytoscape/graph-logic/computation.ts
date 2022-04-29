import { EdgeDefinition, NodeDefinition } from 'cytoscape';
import { v4 as uuid } from 'uuid';
import { Podcast } from '../../../../client/interfaces';
import {
  findSharedCategoriesAndKeywords, haveSharedElements,
  removeDuplicateElements,
} from './utils';

export interface DisjointGraphFunctionNode extends Pick<Podcast, 'subscribeUrl'> {
  keywordsAndCategories: string[];
  visited: boolean;
}
/**
 * @param nodes
 * @param disjointGraphs The intermediate result through recursion
 * @returns
 *   An array of graph representations grouped by shared keywords & categories
 */
export const findAllDisjointGraphs = (nodes: DisjointGraphFunctionNode[],
  disjointGraphs : DisjointGraphFunctionNode[][] = []) : DisjointGraphFunctionNode[][] => {
  const firstUnvisitedNode = nodes.find(item => item.visited !== true);
  if (!firstUnvisitedNode) return disjointGraphs;

  firstUnvisitedNode.visited = true;
  let keywordsAndCategoriesInCommon = firstUnvisitedNode.keywordsAndCategories;

  const graph = [firstUnvisitedNode];
  let relatedPodcast;
  do {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    relatedPodcast = nodes.find(item => item.visited !== true
        && haveSharedElements(keywordsAndCategoriesInCommon, item.keywordsAndCategories));
    if (!relatedPodcast) break;

    relatedPodcast.visited = true;
    keywordsAndCategoriesInCommon = removeDuplicateElements([...keywordsAndCategoriesInCommon,
      ...relatedPodcast.keywordsAndCategories]);
    graph.push(relatedPodcast);
  } while (relatedPodcast);

  disjointGraphs.push(graph);

  return findAllDisjointGraphs(nodes, disjointGraphs);
};

/**
 * @param subscriptions
 * @param disjointGraphs
 * @returns The findAllDisjointGraphs result mapped onto the subscriptions metadata
 */
const finalizeDisjointGraphsObject = (subscriptions: Podcast[],
  disjointGraphs:DisjointGraphFunctionNode[][]) => disjointGraphs
  .map(graph => graph
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
  return finalizeDisjointGraphsObject(subscriptions, findAllDisjointGraphs(nodes));
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

export const generateEdges = (disjointGraphs: Podcast[][]) => {
  const eachDisjointGraphEdges = disjointGraphs.map(graph => graph
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
          label: relations.join(', '),
        };
        return { data: edge };
      });

      return [...acc, ...result];
    }, [])
  // remove duplicate edges since the graph is undirected.
    .reduce((acc: EdgeDefinition[], edge) => (
      acc.some(item => item.data.target === edge.data.source &&
         item.data.source === edge.data.target)
        ? acc
        : acc.concat(edge)
    ), []));

  const edges = eachDisjointGraphEdges.reduce((acc, curr) => [...acc, ...curr], []);

  return edges;
};
