import React from 'react';
import { Button } from 'react-bootstrap';
import { FaRss, FaPlus, FaMinus } from 'react-icons/fa';
import style from 'style.module.scss';
// const PlusIcon = styled(FaPlus)`
//   position: absolute;
//   right: 4px;
//   top: 4px;
//   font-size: .7rem;
// `;

// const MinusIcon = styled(FaMinus)`
//   position: absolute;
//   right: 4px;
//   top: 4px;
//   font-size: .7rem;
// `;
// const CustomBtn = styled(Button)`
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
    className={style['custom-btn'] + className}
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
