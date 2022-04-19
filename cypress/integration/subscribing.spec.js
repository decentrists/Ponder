import seeds from '../../seeders/seeds.json';

before(() => {
  cy.clearLocalStorage();
  cy.viewport(375, 812);
  cy.visit('/');
});

function checkCanvases() {
  cy.get('[class$="cytoscape_container"] canvas:first-of-type').toMatchImageSnapshot();
  cy.get('[class$="cytoscape_container"] canvas:nth-of-type(2)').toMatchImageSnapshot();
  cy.get('[class$="cytoscape_container"] canvas:last-of-type').toMatchImageSnapshot();
}

it('Can subscribe via RSS URL and changes are reflected in pod graph', () => {
  checkCanvases();
  cy.get('#query').type('https://feeds.simplecast.com/dHoohVNH');
  cy.get('.toast-header').should('not.exist');
  cy.get('#query').siblings('span').children('button').click();
  cy.get('.toast-header').should('be.visible');
  checkCanvases();
});

it('Should record RSS response in localStorage', () => {
  console.log(window.localStorage.getItem('subscriptions'));
  const podcasts = JSON.parse(window.localStorage.getItem('subscriptions'));
  expect(podcasts).to.deep.equal([seeds.podcasts[0]]);
});
