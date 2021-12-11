import styles from './cytoscape/styles';

function normalizeElements(elements) {
  const isArray = elements.length != null;
  if (isArray) return elements;
  let { nodes, edges } = elements;
  if (nodes == null) nodes = [];
  if (edges == null) edges = [];
  return nodes.concat(edges);
}

export default function getElementsFromSubscriptions(subscriptions) {
  const nodes = subscriptions.map(podcast => ({
    group: 'nodes',
    classes: 'wtf',
    data: {
      id: podcast.subscribeUrl,
      label: podcast.title,
      categories: podcast.categories,
      NodesBg: 'green', // TODO: Make 'grey' if not subscribed podcast
      episodes: podcast.episodes,
      description: podcast.description,
      title: podcast.title,
      imageUrl: podcast.imageUrl,
      imageTitle: podcast.title,
    },
  }));

  const edges = subscriptions
    .reduce((acc, podcast, _, xs) => {
      // A match is any other podcast that has one same category or keyword
      const matches = xs.filter(({ categories, keywords }) => (
        podcast.categories.some(category => categories.includes(category))
        || podcast.keywords.some(keyword => keywords.includes(keyword))
      ));

      // If there are no matches there is nothing to add
      if (!matches.length) return acc;

      // Tack dat on
      return acc.concat(matches.map(match => {
        const relations = podcast.categories.filter(category => match.categories.includes(category))
          .concat(podcast.keywords.filter(keyword => match.keywords.includes(keyword)));
        return {
          source: podcast.subscribeUrl,
          target: match.subscribeUrl,
          EdgeStyle: relations.length ? 'solid' : 'dashed', // havent tested yet with a different podcast categories dure to CORS issue...i told matt about it
          label: relations.join(', '),
        };
      }));
    }, [])
    .reduce((acc, edge) => (
      acc.some(a => a.target === edge.source && a.source === edge.target)
        ? acc
        : acc.concat(edge)
    ), [])
    .filter(edge => edge.target !== edge.source)
    .map(data => ({
      data,
    }));

  return normalizeElements({ nodes, edges });
}
