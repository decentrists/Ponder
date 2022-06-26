import React, { createContext, useState } from 'react';
import { Button, Toast, ToastProps } from 'react-bootstrap';
import { v4 as uuid } from 'uuid';
import { Box } from '@mui/material';
import style from './Toast.module.scss';

interface CustomHeaderProps {
  className: string;
  closeToast: () => void;
  children: React.ReactNode;
}

const CustomHeader : React.FC<CustomHeaderProps> = ({ closeToast, className, children }) => (
  <Button
    type="button"
    className={`${style['close-button']} ${className} btn-close fa fa-times`}
    onClick={closeToast}
  >
    {children}
  </Button>
);

const TOAST_DELAY = 3500;

interface Props {
  children: React.ReactNode
}

interface ToastOptions extends Omit<ToastProps, 'autohide' | 'delay'> {
  autohideDelay?: number
  variant?: string;
  header?: string;
}

type ToastDispatchFunction = (text: string, options?: ToastOptions) => void;

interface Message extends ToastOptions {
  id: string;
  text: string;
}

export const ToastContext = createContext<ToastDispatchFunction>(() => {});

const ToastProvider : React.FC<Props> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const dispatchToastMessage : ToastDispatchFunction = (text, options = {}) => {
    const id = uuid();
    const { autohideDelay, variant, ...otherOptions } = options;

    // We autohide the toast by default unless autohideDelay=0 is specified in `options`
    if (autohideDelay !== 0) setTimeout(() => handleClose(id), autohideDelay || TOAST_DELAY);

    console.debug(text);
    setMessages(prev => prev.concat({
      ...otherOptions,
      variant: variant?.trim() || 'primary',
      text,
      id,
    }));
  };

  function handleClose(messageId: Message['id']) {
    setMessages(prev => prev.filter(a => a.id !== messageId));
  }

  return (
    <ToastContext.Provider value={dispatchToastMessage}>
      {children}
      <Box component="ul" className={style['toast-list']}>
        {messages.map(message => (
          <li key={message.id}>
            <Toast
              delay={TOAST_DELAY}
              // @ts-ignore
              variant={message.variant}
              onClose={() => handleClose(message.id)}
            >
              <CustomHeader
                className={`toast-${message.variant}`}
                closeToast={() => handleClose(message.id)}
              >
                {message.header}
              </CustomHeader>
              <Toast.Body className={`toast-${message.variant}`}>
                {message.text}
              </Toast.Body>
            </Toast>
          </li>
        ))}
      </Box>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
