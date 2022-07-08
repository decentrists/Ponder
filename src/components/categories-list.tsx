import { Box, Typography } from '@mui/material';
import React from 'react';
import style from './category-list.module.scss';

interface Props {
  categories: string[];
}

// @ts-ignore
const CategoriesList : React.FC<Props> = ({ categories }) => (
  <Box className={style['category-list-container']}>
    <Typography variant="h5" className={style['category-header']}>
      Popular
    </Typography>
    <Box className={style['category-list']}>
      <Box className={style['category-item']}>
        Comedy
      </Box>
      <Box className={style['category-item']}>
        Political
      </Box>
      <Box className={style['category-item']}>
        Tech
      </Box>
      <Box className={style['category-item']}>
        Sports
      </Box>
      <Box className={style['category-item']}>
        Comedy
      </Box>
    </Box>
  </Box>
);

export default CategoriesList;
