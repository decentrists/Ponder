import React from 'react';
import { Button } from 'react-bootstrap';
import { CgTrash } from 'react-icons/cg';
import style from './style.module.scss';

interface Props {
  onClick: () => void;
}

const RemoveBtn : React.FC<Props> = ({
  onClick,
  ...props
}) => (
  <Button
    className={style['delete-btn']}
    onClick={onClick}
    {...props}
  >
    <CgTrash />
  </Button>
);

export default RemoveBtn;
