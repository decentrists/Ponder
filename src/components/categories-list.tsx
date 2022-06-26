import { Box } from '@mui/material';
import React from 'react';
import style from './CategoryList.module.scss';

interface Props {
  categories: string[];
}

// @ts-ignore
const CategoriesList : React.FC<Props> = ({ categories }) => (
  <Box className={style['list-container']}>
    <Box className={style['category-header']}>
      Popular
    </Box>
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
