import React from 'react';
import styled from 'styled-components';

const LoadingText = styled.p`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

function Loading() {
  return (
    <LoadingText>Loading&hellip;</LoadingText>
  );
}

export default Loading;
