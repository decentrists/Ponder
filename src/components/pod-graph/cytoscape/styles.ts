import { Core } from 'cytoscape';

export default function styles(cy: Core) {
  Object.entries({
    'background-color': '#020202',
    width: '160px',
    height: '160px',
  }).forEach(([k, v]) => {
    // TODO: below code is indeed correct and should be supported
    // by the package types but unfortunately it's not. it'll probably
    // be fixed in a quick time though in its newer versions.
    // @ts-ignore
    cy.style().selector('node').style(k, v).update();
  });

  // EDGES
  Object.entries({
    'line-color': '#262626',
    color: 'white',
    'source-arrow-color': '#79797a',
    label: 'data(label)',
    'curve-style': 'straight',
    'font-weight': 200,
    'font-size': '20px',
    'source-arrow-shape': 'square',
    'target-arrow-shape': 'square',
    'text-halign': 'center',
    'text-valign': 'center',
    'text-max-width': 120,
    'text-wrap': 'wrap',
    'text-overflow-wrap': 'anywhere',
    'text-justification': 'center',
    'text-rotation': 'autorotate',
    'text-background-color': '#101010',
    'text-background-shape': 'roundrectangle',
    'text-border-color': '#000',
    'text-border-width': 1,
    'text-border-opacity': 1,
    padding: 0,
    'text-background-opacity': 0.6,
    'text-background-padding': '6px',
    width: 3,
  }).forEach(([k, v]) => {
    // @ts-ignore
    cy.style().selector('edge').style(k, v).update();
  });

  Object.entries({
    'background-color': '#030303',
    'background-opacity': '1',
    'border-width': '1px',
    'border-color': '#262626',
    color: '#000',
    shape: 'roundrectangle',
    'text-opacity': '0.56',
    'font-size': '10px',
    'text-transform': 'uppercase',
    'text-wrap': 'none',
    'text-max-width': '75px',
    // 'text-overflow-wrap': 'ellipsis',
    'padding-top': '16px',
    'padding-left': '16px',
    'padding-bottom': '16px',
    'padding-right': '16px',
  }).forEach(([k, v]) => {
    // @ts-ignore
    cy.style().selector('$node > node').style(k, v).update();
  });

  // parent
  Object.entries({
    'text-valign': 'bottom',
    'text-halign': 'center',
  }).forEach(([k, v]) => {
    // @ts-ignore
    cy.style().selector(':parent').style(k, v).update();
  });
}
