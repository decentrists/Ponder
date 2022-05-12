import cytoscape from 'cytoscape';
import nodeHtmlLabel from 'cy-node-html-label';
import { sanitizeString, sanitizeUri } from '../../../client/metadata-filtering';
import { CoreWithNodeLabel } from './interfaces';

// @ts-ignore
nodeHtmlLabel(cytoscape);

interface CardData {
  id: string;
  imageUrl: string;
  title: string;
}

function cardElements(data: CardData, selected = '') {
  return `
    <div class="card-front ${selected}" data-id="${sanitizeString(data.id)}">
      <div class="card-front__tp">
        <img class="image-bg" src="${sanitizeUri(data.imageUrl)}" alt="" />
        <h2 class="card-front__heading">
          ${sanitizeString(data.title)}
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
}

export default function applyHtmlLabel(cy: CoreWithNodeLabel) {
  cy.nodeHtmlLabel([
    {
      query: '.customNodes',
      halign: 'center',
      valign: 'center',
      halignBox: 'center',
      valignBox: 'center',
      tpl(data) {
        return cardElements(data as CardData);
      },
    },
    {
      query: '.customNodes:selected',
      halign: 'center',
      valign: 'center',
      halignBox: 'center',
      valignBox: 'center',
      tpl(data) {
        return cardElements(data as CardData, 'selected');
      },
    },
    // {
    //   query: '.customGroup',
    //   halign: 'center',
    //   valign: 'center',
    //   halignBox: 'center',
    //   valignBox: 'center',
    //   tpl(data) {
    //     console.log('custom group data', data);
    //     return `
    //       <div style="border:1px solid red;" class="group ${data.collapsedChildren ?
    //         'show' : 'hide'}" data-id="${sanitizeString(data.id)}">
    //       <h5 class="group-header">
    //       ${sanitizeString(data.label)}
    //       </h5>
    //         <span class="group-graphic ">
    //           <i class="fa fa-heart" aria-hidden="true"></i>
    //         </span>
    //         <div class="card-front__details">
    //           <span class="cardStats_stat cardStats_stat-likes">
    //             <label class="group-label "> episodes</label>
    //            <div>
    //              <i class="fas fa-headset"></i> 69
    //            </div>
    //           </span>
    //           <span class='cardStats_stat cardStats_stat-comments'>
    //           <label class="group-label ">comments</label>
    //             <div>
    //             <i class='far fa-comment fa-fw'></i> 66
    //             </div>
    //           </span>
    //         </div>
    //       </div>
    //     `;
    //   },
    // },
  ]);
}
