/*
Algorithmic Stock Trader II

You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

97,43,92,135,50,118,96,96,76

Determine the maximum possible profit you can earn using as many transactions as you'd like. A transaction is defined as buying and then selling one share of the stock. Note that you cannot engage in multiple transactions at once. In other words, you must sell the stock before you buy it again.

If no profit can be made, then the answer should be 0
 */

import { algorithmicStockTraderIV } from "./stock-trader-IV.ts";

export function algorithmicStockTraderII(prices: number[]): number {
  return algorithmicStockTraderIV([Math.floor(prices.length / 2 + 1), prices]);
}
