import cytoscape from 'cytoscape';
import nodeHtmlLabel from 'cy-node-html-label';
import sanitizeHtml from 'sanitize-html';

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
          <div class="card-front" data-id="${sanitizeHtml(data.id)}">
            <div class="card-front__tp">
              <img class="image-bg" src="${sanitizeHtml(data.imageUrl)}" alt="" />
              <h2 class="card-front__heading">
                ${sanitizeHtml(data.title)}
              </h2>
            </div>
            <div class="card-front-btn">
              <div class="card-front__details">
                <span class="cardStats_stat cardStats_stat-likes">
                <i class="fas fa-headset"></i> 5
                </span>
                <span class='cardStats_stat cardStats_stat-comments'>
               <i class='far fa-comment fa-fw'></i>  54
                </span>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      query: '.customGroup',
      halign: 'center',
      valign: 'center',
      halignBox: 'center',
      valignBox: 'center',
      tpl(data) {
        return `
          <div class="group ${data.collapsedChildren ? 'show' : 'hide'}" data-id="${sanitizeHtml(data.id)}">
          <h5 class="group-header">Favourites</h5>
            <span class="group-graphic ">
              <i class="fa fa-heart" aria-hidden="true"></i>
            </span>
            <div class="card-front__details">
              <span class="cardStats_stat cardStats_stat-likes">
                <label class="group-label "> episodes</label>
               <div>
                 <i class="fas fa-headset"></i> 69
               </div>
              </span>
              <span class='cardStats_stat cardStats_stat-comments'>
              <label class="group-label ">comments</label>
                <div>
                <i class='far fa-comment fa-fw'></i> 66
                </div>
              </span>
            </div>
          </div>
        `;
      },
    },
  ]);
}
