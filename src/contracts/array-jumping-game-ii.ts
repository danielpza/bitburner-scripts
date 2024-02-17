/*
 Array Jumping Game II

You are given the following array of integers:

5,2,1,4,3,3,3,6,4,0,3,3,8,1,0,0,2,5,0,0,1,4,0,4,0

Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.

Assuming you are initially positioned at the start of the array, determine the minimum number of jumps to reach the end of the array.

If it's impossible to reach the end, then the answer should be 0.

*/

export function arrayJumpingGameII(jumps: number[]) {
  let min: number[] = Array.from({ length: jumps.length }, () => Infinity);
  min[0] = 0;
  for (let i = 0; i < jumps.length; i++) {
    let jump = jumps[i];
    let jumpsSoFar = min[i] + 1;
    for (let j = 1; j <= jump; j++) {
      if (i + j >= jumps.length) break;
      min[i + j] = Math.min(jumpsSoFar, min[i + j]);
    }
  }

  if (min.at(-1) === Infinity) return 0;

  return min.at(-1);
}
