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
    background-color: #0d0d0d;
    padding: 0.625rem 1.25rem;
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    justify-content: space-between;
    align-items: center;
    display: flex;
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
`;

const NavList = styled.ul`
    align-items: center;
    justify-content: center;
    width: 100%;
    display: flex;
    list-style: none;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 0;
    z-index: 70;
    font-size: 2rem;
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
