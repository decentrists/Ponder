import cytoscape from 'cytoscape';
import expandCollapse from 'cytoscape-expand-collapse';

if (typeof cytoscape('core', 'expandCollapse') === 'undefined') {
  expandCollapse(cytoscape);
}

export default function applyExpandColapse(cy) {
  cy.expandCollapse({
    layoutBy: {
      fit: true, // whether to fit the viewport to the graph
      name: 'dagre',
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
    },
    fisheye: true,
    animate: false,
    undoable: false,
    expandCollapseCuePosition: 'top-left',
    expandCollapseCueSize: 30,
    expandCollapseCueLineSize: 20,
    expandCueImage: undefined, // image of expand icon if undefined draw regular expand cue
    collapseCueImage: undefined, // image of collapse icon if undefined draw regular collapse cue
    expandCollapseCueSensitivity: 2, // sensitivity of expand-collapse cues
    zIndex: 999,
  });
}
