import React from 'react';
import { Button } from 'react-bootstrap';
import { FaRss, FaPlus, FaMinus } from 'react-icons/fa';
import style from './style.module.scss';

interface Props {
  className?: string,
  removeButton?: boolean,
  disabled?: boolean,
  onClick?: () => void,
}

const RssButton : React.FC<Props> = ({
  className,
  removeButton = false,
  disabled = false,
  onClick,
  ...props
}) => (
  <Button
    className={`${style['custom-btn']} ${className}`}
    type={onClick ? 'button' : 'submit'}
    variant={removeButton ? 'danger' : 'info'}
    onClick={onClick}
    {...props}
  >
    <FaRss />
    {removeButton ? (
      <FaMinus className={style['minus-icon']} />
    ) : (
      <FaPlus className={style['plus-icon']} />
    )}
  </Button>
);

export default RssButton;
