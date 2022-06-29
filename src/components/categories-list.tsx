import React from 'react';
import styled from 'styled-components';
import { ListContainer } from './shared-elements';

interface Props {
  categories: string[];
}

const CategoryHeader = styled.h5`
  color: white;
  font-weight: 700;
  margin-bottom: 0.75rem;
`;

const CategoryList = styled.div`
  display: flex;
  row-gap: 0.625rem;
  column-gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
`;

const CategoryItem = styled.div`
  cursor: default;
  border-radius: 0.75rem;
  border-width: 1px;
  border-color: rgba(72, 72, 72, 1);
  background-color: rgba(16, 16, 16, 1);
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  padding-left: 0.875rem;
  padding-right: 0.875rem;
  font-size: 11px;
  font-weight: 700;
  color: rgba(206, 206, 206, 1);
`;

// @ts-ignore
const CategoriesList : React.FC<Props> = ({ categories }) => (
  <ListContainer>
    <CategoryHeader>
      Popular
    </CategoryHeader>
    <CategoryList>
      <CategoryItem>
        Comedy
      </CategoryItem>
      <CategoryItem>
        Political
      </CategoryItem>
      <CategoryItem>
        Tech
      </CategoryItem>
      <CategoryItem>
        Sports
      </CategoryItem>
      <CategoryItem>
        Comedy
      </CategoryItem>
    </CategoryList>
  </ListContainer>
);

export default CategoriesList;
