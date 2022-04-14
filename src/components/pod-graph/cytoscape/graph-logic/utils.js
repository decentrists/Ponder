export const findSharedCategoriesAndKeywords = (podcast1, podcast2) => removeDuplicateElements([
  ...podcast1.categories.filter(category => podcast2.categories.includes(category)),
  ...podcast1.categories.filter(category => podcast2.keywords.includes(category)),
  ...podcast1.keywords.filter(keyword => podcast2.keywords.includes(keyword)),
  ...podcast1.keywords.filter(keyword => podcast2.categories.includes(keyword)),
]);

export const haveSharedElements = (arr1, arr2) => arr1.some(item => arr2.includes(item));

/**
 * @param {Array} array
 * @returns {Array} The given `array`, omitting duplicate as well as falsy elements
 */
export const removeDuplicateElements = array => [...new Set(array.filter(x => x))];
