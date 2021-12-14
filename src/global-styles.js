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

/* =================== global boot strap =========================*/
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

/* =================== panzoom  =========================*/
.cy-panzoom{
    top: 1rem;
     color: #666;
     z-index: 100;
}
.cy-panzoom-panner {
    background: #030303;
    border: 1px solid #262626;
}
.cy-panzoom-slider-background {
    background: #030303;
    border-left: 1px solid #262626;
    border-right: 1px solid #262626;
}
.cy-panzoom-slider-handle {
    background: #030303;
    border: 1px solid #262626;
}
.cy-panzoom-zoom-button {
    background: #030303;
    border: 1px solid #262626;
}

/* =================== scroll bar =========================*/
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

/* =================== Modal =========================*/
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

/* =================== Card =========================*/

.card-front__heading {
  background: black;
  text-align: center;
  font-size: 27px;
  margin: 0;
  color: #fafbfa !important;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: rgba(185,181,181,0.719);
}

.card-front__tp {
  border-radius: 0.5rem;
  color: #fafbfa;
  height: 80%;
  overflow: hidden;
  position: relative;
}

.card-area {
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  justify-content: space-evenly;
  padding: 1rem;
}

.card-section {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
  background-color: #cccccc;
}

.card-front {
  background-color: #000000d4;
  height: 19rem;
  width: 19rem;
  padding: 5px;
  border-radius: 0.5rem;
}

.card-front-btn {
  align-items: center;
  display: flex;
  justify-content: center;
  padding-top: 0.2rem;
  height: 20%;
}

.card-front__details {
  color: #00b97d;
  border-radius: 0.5rem;
  font-weight: 600;
  overflow: hidden;
}

.cardStats {
  font-size: 0.7em;
  text-align: center;
  width: 100%;
}

.cardStats_stat {
  display: inline-block;
  white-space: nowrap;
  margin-top: 5px;
}

.image-bg {
  opacity: 0.6;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  object-fit: cover;
  border-radius: 0.75rem;
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
