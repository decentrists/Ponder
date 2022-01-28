import styled from 'styled-components';
import { Image, Container } from 'react-bootstrap';

// HEADER COMPONENTS

export const HeaderContainer = styled(Container)`
  display: flex;
  color: white;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10001;
  background-color: #030303;
  margin-left: auto;
  margin-right: auto;
  max-width: 1140px;
  padding-right: 15px;
  padding-left: 15px;
`;

export const ImageWrapper = styled.div`
  padding-right: 0.625rem;
`;

export const FormLayer = styled.div`
  padding: 0.375rem;
  padding-right: 2rem;
  padding-left: 1.25rem;
  border-radius: 9999px;
  overflow: hidden;
  align-items: center;
  background-color: #1a1a1a;
  border: rgba(38, 38, 38, 1) solid 2px;
  width: 100%;
  height: 2.5rem;
  display: flex;
  margin-right: 0.625rem;
`;

export const ImageLogo = styled(Image)`
  box-sizing: border-box;
  padding: 0;
  border: none;
  margin: auto;
  object-fit: contain;
  vertical-align: middle;
`;

export const PodAlert = styled.div`
  border: 2px solid gray;
  border-radius: 9999px;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
`;

export const FormWrapper = styled.div`
  width: 100%;
`;

export const CallToActions = styled.div`
  border: rgba(38, 38, 38, 1) solid 2px;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  height: 2.5rem;
  @media only screen and (max-width: 960px) {
    padding: 0;
    border: none;
  }
`;

// FOOTER

export const Footer = styled.footer`
  background-color: #0d0d0ded;
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

export const NavList = styled.ul`
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

// MAIN LAYOUT

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

export const CenterComponents = styled(Container)`
  display: flex;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  max-width: 1140px;
`;

export const MainContent = styled.div`
  flex-grow: 1;
  max-width: 72rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
`;
