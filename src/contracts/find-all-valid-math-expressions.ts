/*
You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


You are given the following string which contains only digits between 0 and 9:

60201607

You are also given a target number of -53. Return all possible ways you can add the +(add), -(subtract), and *(multiply) operators to the string such that it evaluates to the target number. (Normal order of operations applies.)

The provided answer should be an array of strings containing the valid expressions. The data provided by this problem is an array with two elements. The first element is the string of digits, while the second element is the target number:

["60201607", -53]

NOTE: The order of evaluation expects script operator precedence NOTE: Numbers in the expression cannot have leading 0's. In other words, "1+01" is not a valid expression Examples:

Input: digits = "123", target = 6
Output: [1+2+3, 1*2*3]

Input: digits = "105", target = 5
Output: [1*0+5, 10-5]

 */

export function findAllValidMathExpressions([digits, target]: [string, number]): string[] {
  const numbers = digits.split("").map((n) => Number(n));

  let results: string[] = [];

  function rec(total: number, index: number, mult: number, prev: string) {}

  return rec(target, 0, 1, "");
}
