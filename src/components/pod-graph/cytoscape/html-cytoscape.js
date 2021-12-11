import cytoscape from 'cytoscape';
import nodeHtmlLabel from 'cytoscape-node-html-label';

nodeHtmlLabel(cytoscape);

// TODO: Sanatize data to prevent XSS exploits
export default function applyHtmlLabel(cy) {
  cy.nodeHtmlLabel([
    {
      query: '.wtf',
      halign: 'center',
      valign: 'center',
      halignBox: 'center',
      valignBox: 'center',
      tpl(data) {
        return `
          <div class="pod-graph-card card-front" data-id="${data.id}">
            <div class="card-front__tp">
              <img class="demo-bg" src="${data.imageUrl}" alt="" />
              <h2 class="card-front__heading">
                ${data.title}
              </h2>
            </div>
            <div class="card-front-btn">
              <div class="card-front__stuff">
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
