import { GROW_PER_WEAK, HACK_PER_WEAK } from "./constants.ts";

export function hgwAnalyze(ns: Bitburner.NS, target: string, targetHackPercent: number) {
  const hackAnalyze = ns.hackAnalyze(target);
  if (hackAnalyze === 0) return { hackThreads: 0, growThreads: 0, weakenThreads: 0, totalThreads: 0 };

  // const player = ns.getPlayer();
  // hacking_money

  const hackThreads = Math.floor(targetHackPercent / hackAnalyze);
  const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - hackThreads * hackAnalyze)));
  const weakenThreads = Math.ceil(hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK);

  // ns.print(`hgwAnalyze(${target}, ${targetHackPercent}) = ${hackThreads} + ${growThreads} + ${weakenThreads}`);

  const totalThreads = hackThreads + growThreads + weakenThreads;

  return { hackThreads, growThreads, weakenThreads, totalThreads };
}
