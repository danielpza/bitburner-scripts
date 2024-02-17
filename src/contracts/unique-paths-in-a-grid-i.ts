/*
Unique Paths in a Grid I

You are in a grid with 9 rows and 14 columns, and you are positioned in the top-left corner of that grid. You are trying to reach the bottom-right corner of the grid, but you can only move down or right on each step. Determine how many unique paths there are from start to finish.

NOTE: The data returned for this contract is an array with the number of rows and columns:

[9, 14]
 */

export function uniquePathsIContract([width, height]: [number, number]): number {
  if (width === 0) return 0;
  if (height === 0) return 0;
  if (width === 1) return 1;
  if (height === 1) return 1;
  let prev = Array.from({ length: width }, () => 1);
  for (let i = 1; i < height; i++) for (let j = 1; j < width; j++) prev[j] += prev[j - 1];
  return prev[width - 1];
}
