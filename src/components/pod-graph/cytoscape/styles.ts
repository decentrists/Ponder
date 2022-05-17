import { Stylesheet } from 'cytoscape';

export default function styles() {
  const styleSheet : Stylesheet[] = [
    {
      // Nodes
      selector: 'node',
      style: {
        'shape': 'roundrectangle',
        'background-color': '#020202',
        'width': '160px',
        'height': '160px',
        'padding-top': '16px',
        'padding-left': '16px',
        'padding-bottom': '16px',
        'padding-right': '16px',
        'background-opacity': 1,
        'border-width': '1px',
        'border-color': '#262626',
        // Unused due to cy-node-html-label specifying the style of the node's content:
        // 'color': '#000',
        // 'text-opacity': 0.56,
        // 'font-weight': 400,
        // 'font-size': '10px',
        // 'text-transform': 'uppercase',
        // 'text-wrap': 'none',
        // 'text-max-width': '75px',
        // 'text-overflow-wrap': 'whitespace',
        // 'text-justification': 'center',
        // 'text-halign': 'center',
        // 'text-valign': 'center',
        // 'line-height': 1.5,
      },
    },
    {
      // Edges
      selector: 'edge',
      style: {
        'line-color': '#aaa',
        'color': '#fff',
        'source-arrow-color': '#79797a',
        'label': 'data(label)',
        'curve-style': 'straight',
        'font-weight': 200,
        'font-size': '20px',
        'source-arrow-shape': 'chevron',
        'target-arrow-shape': 'chevron',
        'text-rotation': 'none',
        'text-halign': 'center',
        'text-valign': 'center',
        'text-max-width': '120',
        'text-wrap': 'wrap',
        'text-overflow-wrap': 'anywhere',
        'text-justification': 'center',
        'text-background-color': '#101010',
        'text-background-shape': 'roundrectangle',
        'text-border-color': '#000',
        'text-border-width': 1,
        'text-border-opacity': 0.6,
        'text-background-opacity': 0.6,
        'text-background-padding': '6px',
        'width': 3,
      },
    },
    {
      // Disjoint graphs bounding boxes
      selector: ':parent',
      style: {
        'background-color': '#030303',
        'text-valign': 'bottom',
        'text-halign': 'center',
      },
    },
  ];

  return styleSheet;
}
