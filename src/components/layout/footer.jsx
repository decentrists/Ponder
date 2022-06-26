import React from 'react';
import { Container } from 'react-bootstrap';
import {
  FaHome,
  FaStar,
  FaPlus,
  FaHistory,
  FaCog,
} from 'react-icons/fa';
import { Box } from '@mui/material';
import style from './IndexElements.module.scss';
import NavButton from '../buttons/nav-button';

function LayoutFooter() {
  return (
    <Box component="footer" className={style.footer}>
      <Container as="nav">
        <Box component="ul" className={style['nav-list']}>
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
        </Box>
      </Container>
    </Box>
  );
}

export default LayoutFooter;
