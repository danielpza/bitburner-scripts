import { clusterExec } from "./utils/clusterExec.ts";
import { Jobs, MAX_HACK_CYCLES, SLEEP, Script, TARGET_HACK_PERCENT } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { hgwAnalyze } from "./utils/hgwAnalyze.ts";

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

  const {
    hackThreads,
    growThreads,
    weakenThreads,
    totalThreads: requiredThreads,
  } = hgwAnalyze(ns, target, targetHackPercent);

  if (requiredThreads > freeThreads) {
    return false;
    // throw new Error(`invalid threads`);
  }

  const hackTime = ns.getHackTime(target) + SLEEP * 2;
  const growTime = ns.getGrowTime(target) + SLEEP;
  const weakenTime = ns.getWeakenTime(target);

  const totalTime = Math.max(growTime, hackTime, weakenTime) + extraDelay;

  const hackDelay = totalTime - hackTime;
  const growDelay = totalTime - growTime;
  const weakenDelay = totalTime - weakenTime;

  let i;

  let totalThreads = getClusterFreeThreads(ns, cluster, RAM);

  const LONG_SLEEP = SLEEP * 4;

  for (
    i = 0;
    i < Math.min(maxCycles, Math.max(Math.floor(weakenTime / LONG_SLEEP), 1)) && requiredThreads <= totalThreads;
    i++
  ) {
    clusterExec(ns, cluster, Jobs.Hack(hackThreads, target, hackDelay + i * LONG_SLEEP));
    clusterExec(ns, cluster, Jobs.Grow(growThreads, target, growDelay + i * LONG_SLEEP));
    clusterExec(ns, cluster, Jobs.Weaken(weakenThreads, target, weakenDelay + i * LONG_SLEEP));
    totalThreads -= requiredThreads;
  }

  const moneyStolen = Math.min(
    ns.hackAnalyze(target) * hackThreads * ns.getServerMoneyAvailable(target),
    ns.getServerMoneyAvailable(target),
  );
  const moneyAvailable = ns.getServerMoneyAvailable(target);

  const sleepTime = totalTime + LONG_SLEEP * i + 1000;

  ns.print(
    [
      `hacking ${target}`,
      ns.formatNumber(moneyStolen) + "/" + ns.formatNumber(moneyAvailable),
      `(${hackThreads}, ${growThreads}, ${weakenThreads})`,
      `x${i}`,
      ns.tFormat(sleepTime),
    ].join(" "),
  );

  await ns.asleep(sleepTime);
}
