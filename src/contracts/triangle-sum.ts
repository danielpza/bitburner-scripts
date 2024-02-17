/*
Minimum Path Sum in a Triangle

Given a triangle, find the minimum path sum from top to bottom. In each step of the path, you may only move to adjacent numbers in the row below. The triangle is represented as a 2D array of numbers:

[
       [7],
      [1,8],
     [4,4,8],
    [3,1,7,1],
   [2,7,2,9,1],
  [1,8,1,2,9,5]
]

Example: If you are given the following triangle:

[
     [2],
    [3,4],
   [6,5,7],
  [4,1,8,3]
]

The minimum path sum is 11 (2 -> 3 -> 5 -> 1).
 */

export function triangleSumContract(input: number[][]) {
  const rows = input.length;
  const cols = input[rows - 1].length;

  const min = Array.from({ length: cols }, () => [] as number[]);

  min[rows - 1] = input[rows - 1];

  for (let r = rows - 2; r >= 0; r--) {
    for (let c = 0; c < input[r].length; c++) {
      min[r][c] = input[r][c] + Math.min(min[r + 1][c], min[r + 1][c + 1]);
    }
  }

  return min[0][0];
}
