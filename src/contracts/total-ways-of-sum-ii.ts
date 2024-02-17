/*
Total Ways to Sum II

How many different distinct ways can the number 133 be written as a sum of integers contained in the set:

[1,3,4,7,10,12,13,14,16,18,20,21]?

You may use each integer in the set zero or more times.

 */

export function totalWaysToSumII([total, numbers]: [number, number[]]): number {
  function rec(target: number, index: number): number {
    if (target === 0) return 1;
    if (target < 0 || index === numbers.length) return 0;
    return rec(target - numbers[index], index) + rec(target, index + 1);
  }
  return rec(total, 0);
}
