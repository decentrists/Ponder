import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';

const NavBtn = styled(Button)`
  padding: 0.25rem 0.5rem;
  line-height: 1.75rem;
  border-radius: 50%;
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #fff ;
  box-shadow: none !important;
  &:hover {
    color: #4b9b73;
    background: transparent;
    border: 1px solid transparent !important;
  }
  &:focus {
    color: #4b9b73;
    background: transparent;
    border: 1px solid transparent !important;
  }
`;

function NavButton({ children, ...props }) {
  return (
    <li>
      <NavBtn
        as={NavLink}
        {...props}
      >
        {children}
      </NavBtn>
    </li>
  );
}

NavButton.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
};

export default NavButton;
