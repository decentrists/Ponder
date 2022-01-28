import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button } from 'react-bootstrap';
import { FaRss, FaPlus, FaMinus } from 'react-icons/fa';

const PlusIcon = styled(FaPlus)`
  position: absolute;
  right: 4px;
  top: 4px;
  font-size: .7rem;
`;

const MinusIcon = styled(FaMinus)`
  position: absolute;
  right: 4px;
  top: 4px;
  font-size: .7rem;
`;
const CustomBtn = styled(Button)`
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

function RssButton({
  className,
  removeButton,
  disabled,
  onClick,
  ...props
}) {
  return (
    <CustomBtn
      className={className}
      type={onClick ? 'button' : 'submit'}
      variant={removeButton ? 'danger' : 'info'}
      onClick={onClick}
      {...props}
    >
      <FaRss />
      {removeButton ? (
        <MinusIcon />
      ) : (
        <PlusIcon />
      )}
    </CustomBtn>
  );
}

RssButton.propTypes = {
  className: PropTypes.string,
  removeButton: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

RssButton.defaultProps = {
  className: null,
  removeButton: false,
  disabled: false,
  onClick: null,
};

export default RssButton;
