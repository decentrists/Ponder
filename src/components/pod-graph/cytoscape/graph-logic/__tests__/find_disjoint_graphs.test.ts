import { DisjointGraph, findAllDisjointGraphs } from '../computation';

const getIdsFromGraphs = (graph: DisjointGraph) => 
  graph.nodes.map(item => item.subscribeUrl).sort();

describe('findAllDisjointGraphs works correctly for', () => {
  test('connected graphs', () => {
    const nodes = [{ subscribeUrl: '1', keywordsAndCategories: ['a'], visited: false },
      { subscribeUrl: '2', keywordsAndCategories: ['b', 'c'], visited: false },
      { subscribeUrl: '3', keywordsAndCategories: ['a', 'b'], visited: false }];

    const disjointGraphs = findAllDisjointGraphs(nodes); 
    const ids = disjointGraphs.map(graph => getIdsFromGraphs(graph));
    const keywords = disjointGraphs.map((graph) => graph.sharedKeywordsAndCategories);

    const expectedIds = [['1', '2', '3']];
    const expectedKeywords = [[{ name: 'a', count: 2 },
      { name: 'b', count: 2 }, { name: 'c', count: 1 }]];

    expect(keywords).toEqual(expectedKeywords);
    expect(ids).toEqual(expectedIds);
  });

  test('disconnected graphs', () => {
    const nodes = [{ subscribeUrl: '1', keywordsAndCategories: ['a'], visited: false },
      { subscribeUrl: '2', keywordsAndCategories: ['c'], visited: false },
      { subscribeUrl: '3', keywordsAndCategories: ['b'], visited: false }];

    const disjointGraphs = findAllDisjointGraphs(nodes); 
    const ids = disjointGraphs.map(graph => getIdsFromGraphs(graph));
    const keywords = disjointGraphs.map((graph) => graph.sharedKeywordsAndCategories);

    const expectedIds = [['1'], ['2'], ['3']];
    const expectedKeywords = [[{ name: 'a', count: 1 }],
      [{ name: 'c', count: 1 }], [{ name: 'b', count: 1 }]];

    expect(keywords).toEqual(expectedKeywords);
    expect(ids).toEqual(expectedIds);
  });

  test('two disjoint graphs', () => {
    const nodes = [{ subscribeUrl: '1', keywordsAndCategories: ['a'], visited: false },
      { subscribeUrl: '2', keywordsAndCategories: ['b', 'a'], visited: false },
      { subscribeUrl: '3', keywordsAndCategories: ['f'], visited: false }];

    const disjointGraphs = findAllDisjointGraphs(nodes); 
    const ids = disjointGraphs.map(graph => getIdsFromGraphs(graph));
    const keywords = disjointGraphs.map((graph) => graph.sharedKeywordsAndCategories);

    const expectedIds = [['1', '2'], ['3']];
    const expectedKeywords = [[{ name: 'a', count: 2 },
      { name: 'b', count: 1 }], [{ name: 'f', count: 1 }]];

    expect(keywords).toEqual(expectedKeywords);
    expect(ids).toEqual(expectedIds);
    
  });

  test('two disjoint graphs each containing multiple nodes', () => {
    const nodes = [{ subscribeUrl: '1', keywordsAndCategories: ['a', 'l'], visited: false },
      { subscribeUrl: '2', keywordsAndCategories: ['d', 'c'], visited: false },
      { subscribeUrl: '3', keywordsAndCategories: ['c', 'm'], visited: false },
      { subscribeUrl: '4', keywordsAndCategories: ['l', 'z', 'a'], visited: false },
      { subscribeUrl: '5', keywordsAndCategories: ['f', 'b', 'a'], visited: false }];

    const disjointGraphs = findAllDisjointGraphs(nodes); 
    const ids = disjointGraphs.map(graph => getIdsFromGraphs(graph));
    const keywords = disjointGraphs.map((graph) => graph.sharedKeywordsAndCategories);

    const expectedIds = [['1', '4', '5'], ['2', '3']];
    const expectedKeywords = [[{ name: 'a', count: 3 },
      { name: 'l', count: 2 }, { name: 'z', count: 1 }, { name: 'f', count: 1 },
      { name: 'b', count: 1 }],
    [{ name: 'd', count: 1 }, { name: 'c', count: 2 }, { name: 'm', count: 1 }]];

    expect(keywords).toEqual(expectedKeywords);
    expect(ids).toEqual(expectedIds);
  });
});
