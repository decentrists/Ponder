import React from 'react';
import PropTypes from 'prop-types';
import Footer from './footer';
import { Page, CenterComponents, MainContent } from './index-elements';

function Layout({ children }) {
  return (
    <Page>
      <CenterComponents>
        <MainContent>
          {children}
        </MainContent>
      </CenterComponents>
      <Footer />
    </Page>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
