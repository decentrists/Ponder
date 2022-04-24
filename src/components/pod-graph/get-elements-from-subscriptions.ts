import {
  groupSubscriptionsBySharedKeywords, generateNodes, generateEdges,
} from './cytoscape/graph-logic/computation';

export default function getElementsFromSubscriptions(subscriptions) {
  const disjointGraphs = groupSubscriptionsBySharedKeywords(subscriptions);
  const nodes = generateNodes(disjointGraphs);
  const edges = generateEdges(disjointGraphs);

  return [...nodes, ...edges];
}
