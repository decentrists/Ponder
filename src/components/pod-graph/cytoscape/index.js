import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import layout from './layout';
import applyStyles from './styles';
import applyPanzoom from './panzoom';
import applyEvents from './events';
import applyNodeGroups from './node-groups';
import applyHtmlLabel from './html-cytoscape';
// import applyExpandColapse from './expand-colapse';

cytoscape.use(dagre);

export default function createCytoscape(container, elements, deps) {
  const cy = cytoscape({
    container,
    layout,
    elements,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    autoungrabify: false,
  });
  applyStyles(cy, deps);
  applyPanzoom(cy, deps);
  applyEvents(cy, deps);
  applyNodeGroups(cy, deps);
  applyHtmlLabel(cy, deps);
  // applyExpandColapse(cy, deps);
  cy.fit();
  return cy;
}
