import { binarySearch } from "./utils/binarySearch.ts";
import { clusterExec } from "./utils/clusterExec.ts";
import {
  GROW_PER_WEAK,
  HACK_PER_WEAK,
  Jobs,
  MAX_HACK_CYCLES,
  SLEEP,
  Script,
  TARGET_HACK_PERCENT,
} from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  await hackTarget(ns, target);
}

export async function hackTarget(
  ns: Bitburner.NS,
  target: string,
  { maxCycles = MAX_HACK_CYCLES, targetHackPercent = TARGET_HACK_PERCENT, extraDelay = 0 } = {},
) {
  const RAM = Math.max(ns.getScriptRam(Script.HACK), ns.getScriptRam(Script.GROW), ns.getScriptRam(Script.WEAKEN));

  const cluster = getRootAccessServers(ns);
  const freeThreads = getClusterFreeThreads(ns, cluster, RAM);
  const threads = getBatchThreadForHackProcess(freeThreads);

  if (!threads) {
    return false;
    // throw new Error(`invalid threads`);
  }

  const { hackThreads, growThreads, weakenThreads } = threads;

  const requiredThreads = hackThreads + growThreads + weakenThreads;

  const hackTime = ns.getHackTime(target) + SLEEP * 2;
  const growTime = ns.getGrowTime(target) + SLEEP;
  const weakenTime = ns.getWeakenTime(target);

  const totalTime = Math.max(growTime, hackTime, weakenTime) + extraDelay;

  const hackDelay = totalTime - hackTime;
  const growDelay = totalTime - growTime;
  const weakenDelay = totalTime - weakenTime;

  let i;

  let totalThreads = getClusterFreeThreads(ns, cluster, RAM);

  for (i = 0; i < maxCycles && requiredThreads <= totalThreads; i++) {
    clusterExec(ns, cluster, Jobs.Hack(hackThreads, target, hackDelay + i * SLEEP));
    clusterExec(ns, cluster, Jobs.Grow(growThreads, target, growDelay + i * SLEEP));
    clusterExec(ns, cluster, Jobs.Weaken(weakenThreads, target, weakenDelay + i * SLEEP));
    totalThreads -= requiredThreads;
  }

  const moneyStolen = Math.min(
    ns.hackAnalyze(target) * hackThreads * ns.getServerMoneyAvailable(target),
    ns.getServerMoneyAvailable(target),
  );
  const moneyAvailable = ns.getServerMoneyAvailable(target);

  ns.print(
    [
      `hacking ${target}`,
      ns.formatNumber(moneyStolen) + "/" + ns.formatNumber(moneyAvailable),
      `(${hackThreads}, ${growThreads}, ${weakenThreads})`,
      `x${i}`,
      ns.tFormat(totalTime),
    ].join(" "),
  );

  await ns.asleep(totalTime + SLEEP * i + 1000);

  function getGrowWeakenThreads(hackThreads: number) {
    const percentStolen = Math.min(ns.hackAnalyze(target) * hackThreads, 1);
    const growThreads = Math.ceil(
      ns.growthAnalyze(target, Math.min(ns.getServerMaxMoney(target), 1 / (1 - percentStolen))),
    );
    const weakenThreads = Math.ceil(hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK);
    return [growThreads, weakenThreads];
  }

  function getBatchThreadForHackProcess(totalAvailableThreads: number) {
    const maxHackThreads = Math.ceil(
      ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target) * targetHackPercent),
    );

    const hackThreads = binarySearch(1, Math.min(maxHackThreads + 1, totalAvailableThreads), (hackThreads) => {
      const [growThreads, weakenThreads] = getGrowWeakenThreads(hackThreads);
      return hackThreads + growThreads + weakenThreads <= totalAvailableThreads;
    });

    const [growThreads, weakenThreads] = getGrowWeakenThreads(hackThreads);

    if (
      hackThreads <= 0 ||
      growThreads <= 0 ||
      weakenThreads <= 0 ||
      hackThreads + growThreads + weakenThreads > totalAvailableThreads
    ) {
      return null;
    }

    return { hackThreads, growThreads, weakenThreads };
  }
}
