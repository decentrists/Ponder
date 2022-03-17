export default function applyEvents(cy, { setSelectedPodcastId }) {
  cy.on('tap', 'node', evt => {
    const data = evt.target.data();
    setSelectedPodcastId(data.id);
  });
}
