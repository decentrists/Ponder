import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Container,
} from 'react-bootstrap';
import Footer from './footer';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;

`;
const CenterComponents = styled(Container)`
    display: flex;
    justify-content: center;
`;

const MainContent = styled.div`
    flex-grow: 1;
    max-width: 72rem;
    padding-top: 1rem;
    padding-bottom: 1rem;

`;

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
