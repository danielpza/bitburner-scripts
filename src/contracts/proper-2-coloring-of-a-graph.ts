/*
Proper 2-Coloring of a Graph

You are given the following data, representing a graph:
[6,[[2,5],[1,3],[4,5],[1,5],[1,2],[0,3]]]
Note that "graph", as used here, refers to the field of graph theory, and has no relation to statistics or plotting. The first element of the data represents the number of vertices in the graph. Each vertex is a unique number between 0 and 5. The next element of the data represents the edges of the graph. Two vertices u,v in a graph are said to be adjacent if there exists an edge [u,v]. Note that an edge [u,v] is the same as an edge [v,u], as order does not matter.
You must construct a 2-coloring of the graph, meaning that you have to assign each vertex in the graph a "color", either 0 or 1, such that no two adjacent vertices have the same color. Submit your answer in the form of an array, where element i represents the color of vertex i. If it is impossible to construct a 2-coloring of the given graph, instead submit an empty array.

Examples:

Input: [4, [[0, 2], [0, 3], [1, 2], [1, 3]]]
Output: [0, 0, 1, 1]

Input: [3, [[0, 1], [0, 2], [1, 2]]]
Output: []
 */

enum Color {
  void = -1,
  black = 0,
  white = 1,
}

export function proper2ColoringOfAGraphContrect([v, edges]: [number, [number, number][]]): Color[] {
  let colors: Color[] = Array.from({ length: v }, () => Color.void);

  let adjList: number[][] = Array.from({ length: v }, () => []);

  for (let [u, v] of edges) {
    adjList[u].push(v);
    adjList[v].push(u);
  }

  function dfs(u: number, color: Color) {
    if (colors[u] !== Color.void) return colors[u] === color;

    colors[u] = color;

    const nextColor = color === Color.black ? Color.white : Color.black;

    for (let v of adjList[u]) {
      if (!dfs(v, nextColor)) return false;
    }

    return true;
  }

  if (!dfs(0, Color.black)) return [];

  if (colors.find((c) => c === Color.void) !== undefined) return [];

  return colors;
}
