import styled from 'styled-components';
import { Button as BsButton } from 'react-bootstrap';

const SpinButton = styled(BsButton)`
  padding: 0.25rem 0.5rem;
  line-height: 1.75rem;
  border-radius: 50%;
  background: transparent !important;
  border: 1px solid transparent !important;
  color: #fff;
  box-shadow: none !important;
  svg {
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    transition: all .3s ease;
    opacity: 1;
    fill: #fff;
  }
  &&:hover svg {
    fill: #4b9b73;
  }
  &&:focus svg {
    fill: #4b9b73;
  }
  &&.spinning svg {
    animation: spin 1s infinite;
  }
  &&:disabled svg {
    opacity: 0.5;
  }
`;

export default SpinButton;
