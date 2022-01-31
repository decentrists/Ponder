export default function applyEvents(cy, { setSelectedPodcast, toggleModal }) {
  cy.on('tap', 'node', event => {
    setSelectedPodcast(event.target._private.data);
  });
  cy.on('tap', 'node', toggleModal);// no logic of toggle modal
}
