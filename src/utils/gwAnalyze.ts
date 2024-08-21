import { GROW_PER_WEAK } from "./constants.ts";

// const currentMoney = ns.getServerMoneyAvailable(target);
// const maxMoney = ns.getServerMaxMoney(target);
// const mult = maxMoney / Math.max(currentMoney, 1);
export function gwAnalyze(ns: Bitburner.NS, target: string, mult: number) {
  const growThreads = Math.ceil(ns.growthAnalyze(target, mult));
  const weakenThreads = Math.ceil(growThreads / GROW_PER_WEAK);

  const totalThreads = growThreads + weakenThreads;

  return { growThreads, weakenThreads, totalThreads };
}
