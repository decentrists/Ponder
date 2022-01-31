import React from 'react';
import { Container } from 'react-bootstrap';
import {
  FaHome,
  FaStar,
  FaPlus,
  FaHistory,
  FaCog,
} from 'react-icons/fa';
import NavButton from '../buttons/nav-button';
import { Footer, NavList } from './index-elements';

function LayoutFooter() {
  return (
    <Footer>
      <Container as="nav">
        <NavList>
          <NavButton to="/">
            <FaHome />
          </NavButton>
          <NavButton to="/favourites">
            <FaStar />
          </NavButton>
          <NavButton to="/add-url">
            <FaPlus />
          </NavButton>
          <NavButton to="/history">
            <FaHistory />
          </NavButton>
          <NavButton to="/settings">
            <FaCog />
          </NavButton>
        </NavList>
      </Container>
    </Footer>
  );
}

export default LayoutFooter;
