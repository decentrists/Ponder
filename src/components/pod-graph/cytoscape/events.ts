import { Core } from 'cytoscape';

export default function applyEvents(cy: Core, { setSelectedPodcastId }) {
  cy.on('tap', 'node', evt => {
    const data = evt.target.data();
    setSelectedPodcastId(data.id);
  });
}
