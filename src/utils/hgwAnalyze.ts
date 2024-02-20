import { GROW_PER_WEAK, HACK_PER_WEAK } from "./constants.ts";

export function hgwAnalyze(ns: Bitburner.NS, target: string, targetHackPercent: number) {
  const hackThreads = Math.ceil(targetHackPercent / ns.hackAnalyze(target));
  const growThreads = Math.ceil(ns.growthAnalyze(target, 1 / (1 - ns.hackAnalyze(target) * hackThreads)));
  const weakenThreads = Math.ceil(hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK);

  const totalThreads = hackThreads + growThreads + weakenThreads;

  return { hackThreads, growThreads, weakenThreads, totalThreads };
}
