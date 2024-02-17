/*
Unique Paths in a Grid II

You are located in the top-left corner of the following grid:

0,0,1,
0,1,0,
0,0,0,
0,0,0,
1,0,0,
0,0,1,
0,0,1,
0,0,0,
1,0,0,
0,0,0,
0,0,0,
0,0,0,

You are trying reach the bottom-right corner of the grid, but you can only move down or right on each step. Furthermore, there are obstacles on the grid that you cannot move onto. These obstacles are denoted by '1', while empty spaces are denoted by 0.

Determine how many unique paths there are from start to finish.

NOTE: The data returned for this contract is an 2D array of numbers representing the grid.
 */

enum Value {
  empty = 0,
  obstacle = 1,
}

export function uniquePathsInAGridII(grid: number[][]): number {
  const width = grid[0].length;
  const height = grid.length;

  let prev: number[] = Array.from({ length: width }, () => 0);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const topValue = prev[j];

      prev[j] = 0;

      if (grid[i][j] === Value.obstacle) continue;
      if (i === 0 && j === 0) prev[j] = 1;
      if (i > 0) prev[j] += topValue;
      if (j > 0) prev[j] += prev[j - 1];
    }
  }

  return prev[width - 1];
}
