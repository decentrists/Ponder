import React, { createContext, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Toast } from 'react-bootstrap';
import { v4 as uuid } from 'uuid';

const ToastList = styled.ul`
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

  > li:not(:last-of-type) {
    margin-bottom: .5rem;
  }
`;

export const ToastContext = createContext();

function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);

  function dispatchToastMessage(text, options) {
    setMessages(prev => prev.concat({
      ...options,
      text,
      id: uuid(),
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
              autohide
              delay={3000}
              variant={message.variant || 'primary'}
              onClose={() => handleClose(message.id)}
            >
              <Toast.Header closeButton>
                {message.header}
              </Toast.Header>
              <Toast.Body>
                {message.text}
              </Toast.Body>
            </Toast>
          </li>
        ))}
      </ToastList>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ToastProvider;
