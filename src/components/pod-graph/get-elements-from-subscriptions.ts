import {
  groupSubscriptionsBySharedKeywords, generateNodes, generateEdges,
} from './cytoscape/graph-logic/computation';
import { Podcast } from '../../client/interfaces';

export default function getElementsFromSubscriptions(subscriptions: Podcast[]) {
  const disjointGraphs = groupSubscriptionsBySharedKeywords(subscriptions);
  const nodes = generateNodes(disjointGraphs);
  const edges = generateEdges(disjointGraphs);

  return [...nodes, ...edges];
}
