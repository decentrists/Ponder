import React, { createContext, useState } from 'react';
import styled from 'styled-components';
import { Toast } from 'react-bootstrap';
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
const CustomHeader = ({ closeToast }) => (
  <CloseButton
    type='button'
    className='btn-close fa fa-times'
    onClick={closeToast}
  />
);
const TOAST_DELAY = 3500;

export const ToastContext = createContext();

function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);

  function dispatchToastMessage(text, options = {}) {
    const { autohideDelay, variant, ...otherOptions } = options;
    const id = uuid();

    // We autohide the toast by default unless autohideDelay=0 is specified in `options`
    if (autohideDelay !== 0) setTimeout(() => handleClose(id), autohideDelay || TOAST_DELAY);

    console.debug(text);
    setMessages(prev => prev.concat({
      ...otherOptions,
      variant: variant?.trim() || 'primary',
      text,
      id,
    }));
  }

  function handleClose(messageId) {
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
}

export default ToastProvider;
