import React from 'react';
import { Container } from 'react-bootstrap';
import { Box } from '@mui/material';
import Footer from './footer';
import style from './index-elements.module.scss';

function Layout({ children }) {
  return (
    <Box className={style.page}>
      <Container className={style['center-components']}>
        <Box className={style['main-content']}>
          {children}
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}

export default Layout;
