import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';
import style from './style.module.scss';

// const NavBtn = styled(Button)`
//   padding: 0.25rem 0.5rem;
//   line-height: 1.75rem;
//   border-radius: 50%;
//   background: transparent !important;
//   border: 1px solid transparent !important;
//   color: #fff ;
//   box-shadow: none !important;
//   &:hover {
//     color: #4b9b73;
//     background: transparent;
//     border: 1px solid transparent !important;
//   }
//   &:focus {
//     color: #4b9b73;
//     background: transparent;
//     border: 1px solid transparent !important;
//   }
// `;

interface Props {
  children: React.ReactNode;
  to: string;
}

const NavButton : React.FC<Props> = ({ children, ...props }) => (
  <li>
    <Button
      className={style['nav-btn']}
      as={NavLink}
      {...props}
    >
      {children}
    </Button>
  </li>
);

export default NavButton;
