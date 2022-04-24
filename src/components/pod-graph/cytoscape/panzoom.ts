import cytoscape from 'cytoscape';
import panzoom from 'cytoscape-panzoom';

panzoom(cytoscape);

export default function applyPanzoom(cy) {
  cy.panzoom({
    // fitPadding: 10,
    fitSelector: ':visible',
    animateOnFit: true,
    animateOnZoom: true,
    zoomFactor: 0.05, // zoom factor per zoom tick
    zoomDelay: 45, // how many ms between zoom ticks
    minZoom: 0.5, // min zoom level
    maxZoom: 3, // max zoom level
    fitPadding: 50, // padding when fitting
    panSpeed: 10, // how many ms in between pan ticks
    panDistance: 10, // max pan distance per tick
    panDragAreaSize: 75,
    panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
    panInactiveArea: 8, // radius of inactive area in pan drag box
    panIndicatorMinOpacity: 0.5,
    zoomOnly: false,
    fitAnimationDuration: 1000, // duration of animation on fit
    sliderHandleIcon: 'fa fa-minus',
    zoomInIcon: 'fa fa-plus',
    zoomOutIcon: 'fa fa-minus',
    resetIcon: 'fa fa-expand',
  });
}
