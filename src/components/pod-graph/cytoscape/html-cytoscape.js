import cytoscape from 'cytoscape';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import { encode } from 'html-entities';

nodeHtmlLabel(cytoscape);

export default function applyHtmlLabel(cy) {
  cy.nodeHtmlLabel([
    {
      query: '.customNodes',
      halign: 'center',
      valign: 'center',
      halignBox: 'center',
      valignBox: 'center',
      tpl(data) {
        return `
          <div class="pod-graph-card card-front" data-id="${encode(data.id, { scope: 'attribute' })}">
            <div class="card-front__tp">
              <img class="image-bg" src="${encode(data.imageUrl, { scope: 'attribute' })}" alt="" />
              <h2 class="card-front__heading">
                ${encode(data.title, { scope: 'attribute' })}
              </h2>
            </div>
            <div class="card-front-btn">
              <div class="card-front__details">
                <section class="cardStats">
                  <span class="cardStats_stat cardStats_stat-likes">
                    5 <i class="fas fa-headset"></i>
                  </span>
                  <span class='cardStats_stat cardStats_stat-comments'>
                    54 <i class='far fa-comment fa-fw'></i>
                  </span>
              </div>
            </div>
          </div>
        `;
      },
    },

  ]);
}
