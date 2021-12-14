/* eslint-disable max-len */
const layout = {
  fit: true, // whether to fit the viewport to the graph
  padding: 80, // the padding on fit
  name: 'dagre',
  nodeSep: 300,
  edgeSep: 200,
  rankSep: 400,
  rankDir: 'LR', // 'TB' for top to bottom flow, 'LR' for left to right,
  ranker: 'tight-tree', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
  minLen(edge) { return 1; }, // number of ranks to keep between the source and target of the edge
  edgeWeight(edge) { return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges
  spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  nodeDimensionsIncludeLabels: true, // whether labels should be included in determining the space used by a node
  animate: false, // whether to transition the node positions
  animateFilter(node, i) { return true; }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  transform(node, pos) { return pos; }, // a function that applies a transform to the final node position
  ready() {}, // on layoutready
  stop() {}, // on layoutstop

  // TODO: with dave
  // boundingBox: {
  //   // x1, y1, x2, y2,
  // }, // constrain layout bounds; or { x1, y1, w, h }
};

export default layout;
