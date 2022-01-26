export default function applyEvents(cy, { setSelectedPodcast }) {
  cy.on('tap', 'node', event => setSelectedPodcast(event.target._private.data));
  cy.on('click', 'node', e => {
    console.log('clicked node', e.target);
  });
}
