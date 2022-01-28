import styled from 'styled-components';
import { Button as BsButton } from 'react-bootstrap';

const SpinButton = styled(BsButton)`
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
  svg {
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    animation: none;
  }
  &:disabled svg {
    animation: spin 1s infinite;
  }
`;

export default SpinButton;
