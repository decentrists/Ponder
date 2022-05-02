import React, { createContext, useState } from 'react';
import styled from 'styled-components';
import { Toast, ToastProps } from 'react-bootstrap';
import { v4 as uuid } from 'uuid';

const ToastList = styled.ul`
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: fixed;
  top: 1rem;
  right: 1rem;
  left: 1rem;
  list-style: none;
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 0;
  line-break: auto;
  white-space: pre-wrap;

  > li:first-child {
    padding-top: 3.5rem;
  }
  > li:not(:last-of-type) {
    margin-bottom: .5rem;
  }
`;
const CloseButton = styled.button`
  float: right;
  padding: 0.5rem;
`;

interface CustomHeaderProps { 
  children: React.ReactNode,
  className: string;
  closeToast: () => void 
}

const CustomHeader : React.FC<CustomHeaderProps> = ({ closeToast, className }) => (
  <CloseButton
    type='button'
    className={`${className} btn-close fa fa-times`}
    onClick={closeToast}
  />
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

type ToastDispatchFunction = (text: string, options: ToastOptions) => void;

interface Message extends ToastOptions {
  id: string;
  text: string;
}

export const ToastContext = createContext<ToastDispatchFunction>(() => {});

const ToastProvider : React.FC<Props> = ({ children }) =>{
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
      <ToastList>
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
      </ToastList>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
