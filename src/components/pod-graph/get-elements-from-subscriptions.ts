import {
  groupSubscriptionsBySharedKeywords, generateNodes, generateEdges,
} from './cytoscape/graph-logic/computation';
import { Podcast } from '../../client/interfaces';

export default function getElementsFromSubscriptions(subscriptions: Podcast[]) {
  const { disjointGraphs, podcasts } = groupSubscriptionsBySharedKeywords(subscriptions);
  const nodes = generateNodes(podcasts);
  const edges = generateEdges(podcasts, disjointGraphs);

  return [...nodes, ...edges];
}
