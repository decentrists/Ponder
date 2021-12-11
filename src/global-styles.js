import { createGlobalStyle } from 'styled-components';
import 'cytoscape-panzoom/cytoscape.js-panzoom.css';

export default createGlobalStyle`
  :root {
    --color-body: #000000fc;
    --color-label: #797979; // Unsure if named well #000000
  }

  html,
  body,
  #root {
    min-height: 100vh;
  }

  body {
    padding-bottom: 4.25rem;
    background-color: var(--color-body);
  }

// bootstrap override
.form-control{
  outline: 2px solid transparent;
    outline-offset: 2px;
    color: #fff;
    font-size: 0.75rem;
    line-height: 1rem;
    background-color: rgba(26, 26, 26, 0);
    border-style: none;
    border-color: #6b7280;
    border-width: 1px;
    border-radius: 0px;
    padding-top: 0.5rem;
    padding-right: 0.75rem;
    padding-bottom: 0.5rem;
    padding-left: 0.75rem;
    appearance: none;
    text-overflow: ellipsis;
    box-shadow: none;
    &:focus{
    outline: 0;
    box-shadow: none;
    color: #fff;
    background-color: rgba(26, 26, 26, 0);
    border: none;
    }
}

  // panzoom controller
.cy-panzoom{
    top: 1rem;
      /* left: 1rem; */
      color: #666;
      z-index: 100;
}
.cy-panzoom-panner {
    background: #121213;
    border: 1px solid #23476d;
}
.cy-panzoom-slider-background {
    background: #121213;
    border-left: 1px solid #23476d;
    border-right: 1px solid #23476d;
}
.cy-panzoom-slider-handle {
    background: #121213;
    border: 1px solid #23476d;
}
.cy-panzoom-zoom-button {
    background: #121213;
    border: 1px solid #23476d;
}

// scroll bars
/* width */
::-webkit-scrollbar {
  width: 1px;
}

/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px rgb(44, 43, 43);
  border-radius: 5px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #2b2c2b;
  border-radius: 5px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background:#2b2c2b;
}

// styling the modal
.modal-content {
    background-color: #16181a;
    color: #868686;

}
.modal-header {
    border-bottom: 1px solid #2c2c2c;
}

.modal-footer {
  border-top: 1px solid #2c2c2c;
}




/* Headings */

/* Main heading for card's front cover */
.card-front__heading {
  background: black;
  text-align: center;
  font-size: 10px;
  color: #fafbfa !important;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: rgba(185, 181, 181, 0.719);
}

/* Front cover */
.card-front__tp {
  border-radius: 0.5rem;
  color: #fafbfa;
  height: 80%;
  overflow: hidden;
  position: relative;
}

/* Container to hold all cards in one place */
.card-area {
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  justify-content: space-evenly;
  padding: 1rem;
}

/* Card ============================================*/

/* Area to hold an individual card */
.card-section {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
  background-color: #cccccc;
}

/* A container to hold the flip card and the inside page */

/* container for the front side */
.card-front {
  background-color: #000000d4;
  height: 19rem;
  width: 19rem;
  padding: 5px;
  border-radius: 0.5rem;
}

/* Front card's bottom section */
.card-front-btn {
  align-items: center;
  /*   align-items: end; */
  display: flex;
  justify-content: center;
  padding-top: 0.2rem;
  height: 20%;
}

.card-front__stuff {
  color: #00b97d;
  border-radius: 0.5rem;
  font-weight: 600;
  overflow: hidden;
  /*   padding: 0.5rem 0.75rem;
  width: 90%;
  z-index: 10; */
}

.cardStats {
  /*   font-size: 0.9em; */

  font-size: 0.7em;
  text-align: center;
  width: 100%;
}

.cardStats_stat {
  display: inline-block;
  white-space: nowrap;
  margin-top: 5px;
}

/* //bgg img */
.demo-bg {
  /*
  border-radius: 0.3rem; */
  opacity: 0.6;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  object-fit: cover;
  border-radius: 0.75rem;
  /*     width: 3rem;
    height: 3rem; */
}

.cardStats_stat-likes {
  color: #b2d9a6;
  margin: 1px;
}

.cardStats_stat-comments {
  color: #ffd433;
  margin: 1px;
}

`;
