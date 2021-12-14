/* eslint-disable max-len */
export default function styles(cy) {
  Object.entries({
    'background-color': '#020202',
    padding: 20,
    'padding-relative-to': 'width',
    color: 'white',
    'font-weight': 400,
    'font-size': 20,
    'line-height': 1.5,
  })
    .forEach(([k, v]) => {
      cy.style().selector('node').style(k, v).update();
    });

  Object.entries({
    'line-color': '#262626',
    color: '#9e9e9e',
    'source-arrow-color': '#262626',
    'curve-style': 'straight',
    'font-weight': 200,
    'font-size': '20px',
    'source-arrow-shape': 'square',
    'target-arrow-shape': 'triangle',
    width: 3,
  })
    .forEach(([k, v]) => {
      cy.style().selector('edge').style(k, v).update();
    });
}
