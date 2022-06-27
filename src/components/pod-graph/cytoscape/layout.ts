import { DagreLayoutOptions } from 'cytoscape-dagre';

export const desktopLayout : DagreLayoutOptions = {
  // whether to fit the viewport to the graph
  fit: true,
  // the padding on fit
  padding: 80,
  name: 'dagre',
  nodeSep: 50,
  edgeSep: 80,
  rankSep: 300,
  // 'TB' for top to bottom flow, 'LR' for left to right,
  rankDir: 'LR',
  // Type of algorithm to assign a rank to each node in the input graph.
  // Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
  ranker: 'tight-tree',
  // number of ranks to keep between the source and target of the edge
  minLen() { return 1; },
  // higher weight edges are generally made shorter and straighter than lower weight edges
  edgeWeight() { return 1; },
  // Applies a multiplicative factor (>0)  to expand or compress
  // the overall area that the nodes take up
  spacingFactor: undefined,
  // whether labels should be included in determining the space used by a node
  nodeDimensionsIncludeLabels: true,
  // whether to transition the node positions
  animate: false,
  // whether to animate specific nodes when animation is on;
  // non-animated nodes immediately go to their final positions
  animateFilter() { return true; },
  // duration of animation in ms if enabled
  animationDuration: 500,
  // easing of animation if enabled
  animationEasing: undefined,
  // a function that applies a transform to the final node position
  transform(node, pos) { return pos; },
  // on layoutready
  ready() {},
  // on layoutstop
  stop() {},
};

export const mobileLayout : DagreLayoutOptions = {
  // whether to fit the viewport to the graph
  fit: true,
  // the padding on fit
  padding: 250,
  name: 'dagre',
  nodeSep: 5,
  edgeSep: 50,
  rankSep: 250,
  // 'TB' for top to bottom flow, 'LR' for left to right,
  rankDir: 'TB',
  // Type of algorithm to assign a rank to each node in the input graph.
  // Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
  ranker: 'tight-tree',
  // number of ranks to keep between the source and target of the edge
  minLen() { return 1; },
  // higher weight edges are generally made shorter and straighter than lower weight edges
  edgeWeight() { return 1; },
  // Applies a multiplicative factor (>0)  to expand or compress
  // the overall area that the nodes take up
  spacingFactor: undefined,
  // whether labels should be included in determining the space used by a node
  nodeDimensionsIncludeLabels: true,
  // whether to transition the node positions
  animate: false,
  // whether to animate specific nodes when animation is on;
  // non-animated nodes immediately go to their final positions
  animateFilter() { return true; },
  // duration of animation in ms if enabled
  animationDuration: 500,
  // easing of animation if enabled
  animationEasing: undefined,
  // a function that applies a transform to the final node position
  transform(node, pos) { return pos; },
  // on layoutready
  ready() {},
  // on layoutstop
  stop() {},
};
