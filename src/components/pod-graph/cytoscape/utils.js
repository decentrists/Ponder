export const haveSharedElements = (arr1, arr2) => arr1.some(item => arr2.includes(item));

const removeDuplicateElements = array => [...new Set(array)];

export const findSharedCategoriesAndKeywords = (podcast1, podcast2) => removeDuplicateElements([
  ...podcast1.categories.filter(category => podcast2.categories.includes(category)),
  ...podcast1.categories.filter(category => podcast2.keywords.includes(category)),
  ...podcast1.keywords.filter(keyword => podcast2.keywords.includes(keyword)),
  ...podcast1.keywords.filter(keyword => podcast2.categories.includes(keyword)),
]);

const removeVisitedProperty = disjointGraphs => disjointGraphs
  .map(graph => graph.map(({ visited, ...subscription }) => subscription));

export const findAllDisjointGraphs = (subscriptions, disjointGraphs) => {
  const firstUnvisitedNode = subscriptions.find(item => item.visited !== true);
  if (!firstUnvisitedNode) return removeVisitedProperty(disjointGraphs);
  firstUnvisitedNode.visited = true;

  let keywordsAndCategoriesInCommon = removeDuplicateElements([...firstUnvisitedNode.categories,
    ...firstUnvisitedNode.keywords]);

  const graph = [firstUnvisitedNode];
  let relatedPodcast;
  do {
    // eslint-disable-next-line no-loop-func
    relatedPodcast = subscriptions.find(item => item.visited !== true
      && haveSharedElements(keywordsAndCategoriesInCommon, [...item.keywords, ...item.categories]));

    if (!relatedPodcast) break;

    relatedPodcast.visited = true;
    keywordsAndCategoriesInCommon = removeDuplicateElements([...keywordsAndCategoriesInCommon,
      ...relatedPodcast.categories, ...relatedPodcast.keywords]);
    graph.push(relatedPodcast);
  } while (relatedPodcast);

  disjointGraphs.push(graph);

  return findAllDisjointGraphs(subscriptions, disjointGraphs);
};
