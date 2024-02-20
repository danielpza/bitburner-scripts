/*
Algorithmic Stock Trader I

You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i:

95,41,84,102,187,118,63,153,162,175,102,90,79

Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it
 */

import { algorithmicStockTraderIV } from "./stock-trader-IV.ts";

export function algorithmicStockTraderI(prices: number[]): number {
  return algorithmicStockTraderIV([1, prices]);
}
