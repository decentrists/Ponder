import cytoscape, { CytoscapeOptions } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import layout from './layout';
import applyStyles from './styles';
import applyPanzoom from './panzoom';
import applyEvents from './events';
import applyNodeGroups from './node-groups';
import applyHtmlLabel from './html-cytoscape';
import { ExtendedCore } from './interfaces';

cytoscape.use(dagre);

type Deps = {
  setSelectedPodcastId: Function
};

export default function createCytoscape(container: CytoscapeOptions['container'],
  elements:  CytoscapeOptions['elements'], deps: Deps) {
  const cy = cytoscape({
    container,
    layout,
    elements,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    autoungrabify: false,
  }) as ExtendedCore;
  applyStyles(cy);
  applyEvents(cy, deps);
  applyPanzoom(cy);
  applyNodeGroups(cy);
  applyHtmlLabel(cy);
  cy.fit();
  return cy;
}
