import React from 'react';
import styled from 'styled-components';
import { Container } from 'react-bootstrap';
import {
  FaHome,
  FaStar,
  FaPlus,
  FaHistory,
  FaCog,
} from 'react-icons/fa';
import NavButton from './nav-button';

const Footer = styled.footer`
  background-color: #545454;
  box-shadow: 1, 1, 1, rgba(6, 6, 6, .4);
`;

const NavList = styled.ul`
  display: flex;
  align-items: center;
  justify-content: space-between;
  list-style: none;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  padding-left: 0;
`;

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