/*
Array Jumping Game


You are given the following array of integers:

3,0,8,10,0,0,4,2,9,4,7,5,10,1,0,0,10,0,4

Each element in the array represents your MAXIMUM jump length at that position. This means that if you are at position i and your maximum jump length is n, you can jump to any position from i to i+n.

Assuming you are initially positioned at the start of the array, determine whether you are able to reach the last index.

Your answer should be submitted as 1 or 0, representing true and false respectively
 */

import { arrayJumpingGameII } from "./array-jumping-game-ii.ts";

export function arrayJumpingGame(jumps: number[]) {
  return arrayJumpingGameII(jumps) === 0 ? 0 : 1;
}
