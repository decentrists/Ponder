import { v4 as uuid } from 'uuid';
import { findAllDisjointGraphs, findSharedCategoriesAndKeywords, haveSharedElements } from './cytoscape/utils';

export default function getElementsFromSubscriptions(subscriptions) {
  const disjointGraphs = findAllDisjointGraphs(subscriptions, []);

  const nodes = [];

  disjointGraphs.forEach(graph => {
    const id = uuid();
    const compoundNode = {
      group: 'nodes',
      data: {
        id,
        name: id,
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

  const edges = subscriptions
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
      acc.some(a => a.target === edge.source && a.source === edge.target)
        ? acc
        : acc.concat(edge)
    ), []);
  return [...nodes, ...edges];
}
