import React from 'react';
import { Button } from 'react-bootstrap';
import { MdOutlineOpenInFull, MdOutlineCloseFullscreen } from 'react-icons/md';
import style from './style.module.scss';

interface Props {
  collapseGroups: () => void,
  expandGroups: () => void,
  toggle?: boolean,
}

const ToggleBtn : React.FC<Props> = ({
  collapseGroups,
  expandGroups,
  toggle = false,
}) => (
  <Button
    className={style.btn}
    onClick={toggle ? expandGroups : collapseGroups}
  >
    {toggle ? <MdOutlineOpenInFull className={style['btn-icon-open']} />
      : <MdOutlineCloseFullscreen className={style['btn-icon-close']} /> }
  </Button>
);

export default ToggleBtn;
