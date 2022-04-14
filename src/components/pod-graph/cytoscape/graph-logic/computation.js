import { v4 as uuid } from 'uuid';
import {
  findSharedCategoriesAndKeywords, haveSharedElements,
  removeDuplicateElements,
} from './utils';

/**
 * @param {Array.<Object>} nodes
 * @param {Array.<Array.<Object>>} disjointGraphs The intermediate result through recursion
 * @returns {Array.<Array.<Object>>}
 *   An array of graph representations grouped by shared keywords & categories
 */
export const findAllDisjointGraphs = (nodes, disjointGraphs = []) => {
  const firstUnvisitedNode = nodes.find(item => item.visited !== true);
  if (!firstUnvisitedNode) return disjointGraphs;

  firstUnvisitedNode.visited = true;
  let keywordsAndCategoriesInCommon = firstUnvisitedNode.keywordsAndCategories;

  const graph = [firstUnvisitedNode];
  let relatedPodcast;
  do {
    // eslint-disable-next-line no-loop-func
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
 * @param {Array.<Object>} subscriptions
 * @param {Array.<Array.<Object>>} disjointGraphs
 * @returns {Array.<Array.<Object>>}
 *   The findAllDisjointGraphs result mapped onto the subscriptions metadata
 */
const finalizeDisjointGraphsObject = (subscriptions, disjointGraphs) => disjointGraphs
  .map(graph => graph.map(node => subscriptions.find(subscription => subscription.subscribeUrl ===
      node.subscribeUrl)));

/**
 * @param {Array.<Object>} subscriptions
 * @returns {Array.<Array.<Object>>} An array of graphs grouped by shared keywords & categories,
 *   where each graph comprises an array of subscription metadata (nodes)
 */
export const groupSubscriptionsBySharedKeywords = subscriptions => {
  const nodes = subscriptions.map(subscription => ({
    subscribeUrl: subscription.subscribeUrl,
    keywordsAndCategories: removeDuplicateElements([
      ...subscription.keywords, ...subscription.categories]),
  }));
  return finalizeDisjointGraphsObject(subscriptions, findAllDisjointGraphs(nodes));
};

export const generateNodes = disjointGraphs => {
  const nodes = [];

  disjointGraphs.forEach(graph => {
    const id = uuid();
    const compoundNode = {
      group: 'nodes',
      data: {
        id,
      },
      classes: 'customGroup',
    };
    nodes.push(compoundNode);
    nodes.push(...graph.map(podcast => ({
      group: 'nodes',
      classes: 'customNodes',
      data: {
        id: podcast.subscribeUrl,
        label: podcast.title,
        categories: podcast.categories,
        keywords: podcast.keywords,
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

export const generateEdges = disjointGraphs => {
  const eachDisjointGraphEdges = disjointGraphs.map(graph => graph
    .reduce((acc, podcast, _, arrayReference) => {
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
    .reduce((acc, edge) => (
      acc.some(item => item.data.target === edge.data.source &&
         item.data.source === edge.data.target)
        ? acc
        : acc.concat(edge)
    ), []));

  const edges = eachDisjointGraphEdges.reduce((acc, curr) => [...acc, ...curr], []);

  return edges;
};
