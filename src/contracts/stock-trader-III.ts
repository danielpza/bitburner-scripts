/*
Algorithmic Stock Trader III

You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

123,195,70,149,119

Determine the maximum possible profit you can earn using at most two transactions. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0
 */

import { algorithmicStockTraderIV } from "./stock-trader-IV.ts";

export function algorithmicStockTraderIII(prices: number[]): number {
  return algorithmicStockTraderIV([2, prices]);
}
