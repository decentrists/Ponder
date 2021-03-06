import { Box } from '@mui/material';
import React from 'react';
import style from './loading.module.scss';

function Loading() {
  return (
    <Box className={style['loading-text']}>Loading&hellip;</Box>
  );
}

export default Loading;
