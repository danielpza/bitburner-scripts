/*
Total Ways to Sum I

It is possible write four as a sum in exactly four different ways:

    3 + 1
    2 + 2
    2 + 1 + 1
    1 + 1 + 1 + 1

How many different distinct ways can the number 78 be written as a sum of at least two positive integers?
 */

export function totalWaysToSumI(total: number): number {
  let arr = Array.from({ length: total }, (_, i) => 0);
  // function rec(target: number, index: number): number {
  //   if (target === 0) return 1;
  //   if (target < 0 || index === numbers.length) return 0;
  //   return rec(target - numbers[index], index) + rec(target, index + 1);
  // }
  // return rec(total, 0);
}
