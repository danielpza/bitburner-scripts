/*
Algorithmic Stock Trader IV

You are given the following array with two elements:


[5, [152,171,129,71,126,51,59,141,72,187,5,25,69,176,91,63,13,122,65,54,193,14,82,193,135,128,1,182,1,174,160,107,11,115,132,1,79,19,184,102,108,135]]

The first element is an integer k. The second element is an array of stock prices (which are numbers) where the i-th element represents the stock price on day i.

Determine the maximum possible profit you can earn using at most k transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you can buy it again.

If no profit can be made, then the answer should be 0.
*/

export function algorithmicStockTraderIV([N, arr]: [number, number[]]) {
  let dp = [] as number[];
  for (let j = 0; j < arr.length; j++) dp[j] = 0;
  for (let i = 0; i < N; i++) {
    let curr = [0] as number[];
    for (let j = 1; j < arr.length; j++) {
      let best = curr[j - 1];
      for (let jj = 0; jj < j; jj++) {
        const njj = arr[jj];
        const nj = arr[j];
        const actual = nj - njj + (dp[jj - 1] ?? 0);
        best = Math.max(best, actual);
      }
      curr[j] = best;
    }
    dp = curr;
  }
  return dp[arr.length - 1];
}
