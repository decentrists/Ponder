import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { CgTrash } from 'react-icons/cg';

const MinusIcon = styled(CgTrash)`
  font-size: 1.25rem;
  line-height: 1.75rem;
`;
const DeleteBtn = styled(Button)`
  padding: 0.25rem 0.5rem;
  line-height: 1.75rem;
  border-radius: 50%;
  background: transparent;
  border: 1px solid transparent;
  color: #bd0c0c ;
  box-shadow: none !important;
  &:hover {
    color: #641c0f;
    background: transparent;
    border: 1px solid transparent;
  }
`;

function RemoveBtn({
  onClick,
  ...props
}) {
  return (
    <DeleteBtn
      onClick={onClick}
      {...props}
    >
      <MinusIcon />
    </DeleteBtn>
  );
}

RemoveBtn.propTypes = {
  onClick: PropTypes.func,
};

RemoveBtn.defaultProps = {
  onClick: null,
};

export default RemoveBtn;
