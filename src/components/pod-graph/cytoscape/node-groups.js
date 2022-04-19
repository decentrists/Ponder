export default function applyNodeGroups(cy) {
  initializeZoomExtrema(cy);
  fitGraph(cy);
}
// function to center the graph by default
function fitGraph(cy) {
  return cy.fit();
}
function initializeZoomExtrema(cy) {
  // find a good MAXIMUM_ZOOM_LEVEL and DEFAULT_LAYOUT_ZOOM_LEVEL
  const DEFAULT_LAYOUT_ZOOM_LEVEL = 0.5;
  const MAXIMUM_ZOOM_LEVEL = 3;

  // Set the viewport so it centers/zooms the graph.
  cy.fit(); // or cy.reset()
  cy.maxZoom(MAXIMUM_ZOOM_LEVEL);
  let minZoom = cy.zoom();

  if (minZoom > DEFAULT_LAYOUT_ZOOM_LEVEL) {
    // Ensure you can atleast zoom out to the DEFAULT_LAYOUT_ZOOM_LEVEL.
    minZoom = DEFAULT_LAYOUT_ZOOM_LEVEL;
  } else {
    // At this point, `minZoom` corresponds to the zoom distance where all
    // podcasts fit. Allow zooming out twice as far, to compensate for smaller screens.
    minZoom *= 0.5;
  }
  cy.minZoom(minZoom);
  cy.maxZoom(MAXIMUM_ZOOM_LEVEL);
  cy.panzoom({ maxZoom: MAXIMUM_ZOOM_LEVEL, minZoom });
}
