import { Primitive } from '../../../../utils';
import { Podcast } from './interfaces/interfaces';

export const findSharedCategoriesAndKeywords = (podcast1: Podcast,
  podcast2: Podcast) => {
  const arr = [
    ...podcast1.categories.filter(category => podcast2.categories.includes(category)),
    ...podcast1.categories.filter(category => podcast2.keywords.includes(category)),
    ...podcast1.keywords.filter(keyword => podcast2.keywords.includes(keyword)),
    ...podcast1.keywords.filter(keyword => podcast2.categories.includes(keyword)),
  ];
  return removeDuplicateElements(arr);
};

export const haveSharedElements = <T extends Primitive>(arr1: T[],
  arr2: T[]) => arr1.some(item => arr2.includes(item));

/**
 * @param array
 * @returns The given `array`, omitting duplicate as well as falsy elements
 */
export const removeDuplicateElements = <T extends Primitive>(array: T[]) => [
  ...new Set(array.filter(x => x)),
];