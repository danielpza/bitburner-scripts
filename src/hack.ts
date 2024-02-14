import { growTarget } from "./grow.ts";
import { binarySearch } from "./utils/binarySearch.ts";
import { clusterExec } from "./utils/clusterExec.ts";
import {
  GROW_PER_WEAK,
  HACK_PER_WEAK,
  SLEEP,
  Script,
} from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { weakenTarget } from "./weaken.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const MAX_CYCLES = 1000;

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  const RAM = Math.max(
    ns.getScriptRam(Script.HACK),
    ns.getScriptRam(Script.GROW),
    ns.getScriptRam(Script.WEAKEN),
  );

  for (;;) {
    await weakenTarget(ns, target);
    await growTarget(ns, target);
    await hackTarget();
    await ns.sleep(1500);
  }

  async function hackTarget() {
    const cluster = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, cluster, RAM);
    const threads = getBatchThreadForHackProcess(freeThreads);

    if (!threads) {
      throw new Error(`invalid threads`);
    }

    const { hackThreads, growThreads, weakenThreads } = threads;

    const requiredThreads = hackThreads + growThreads + weakenThreads;

    const hackTime = ns.getHackTime(target) + SLEEP * 2;
    const growTime = ns.getGrowTime(target) + SLEEP;
    const weakenTime = ns.getWeakenTime(target);

    const totalTime = Math.max(growTime, hackTime, weakenTime);

    const hackDelay = totalTime - hackTime;
    const growDelay = totalTime - growTime;
    const weakenDelay = totalTime - weakenTime;

    const sexec = (script: string, threads: number, delay: number) =>
      clusterExec(ns, cluster, { script, target, threads, delay });

    let i;

    let totalThreads = getClusterFreeThreads(ns, cluster, RAM);

    for (i = 0; i < MAX_CYCLES && requiredThreads <= totalThreads; i++) {
      sexec(Script.HACK, hackThreads, hackDelay + i * SLEEP);
      sexec(Script.GROW, growThreads, growDelay + i * SLEEP);
      sexec(Script.WEAKEN, weakenThreads, weakenDelay + i * SLEEP);
      totalThreads -= requiredThreads;
    }

    const moneyStolen = Math.min(
      ns.hackAnalyze(target) * hackThreads * ns.getServerMoneyAvailable(target),
      ns.getServerMoneyAvailable(target),
    );
    const moneyAvailable = ns.getServerMoneyAvailable(target);

    ns.print(
      [
        "hacking...",
        ns.formatNumber(moneyStolen) + "/" + ns.formatNumber(moneyAvailable),
        `(${hackThreads}, ${growThreads}, ${weakenThreads})`,
        `x${i}`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    await ns.asleep(totalTime + SLEEP * i + 1000);
  }

  function getGrowWeakenThreads(target: string, hackThreads: number) {
    const percentStolen = ns.hackAnalyze(target) * hackThreads;
    const growThreads = Math.ceil(
      ns.growthAnalyze(
        target,
        1 / (1 - _.clamp(percentStolen, 0, 1 - Number.EPSILON)),
      ),
    );
    const weakenThreads = Math.ceil(
      hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK,
    );
    return [growThreads, weakenThreads];
  }

  function getBatchThreadForHackProcess(totalAvailableThreads: number) {
    const maxHackThreads = Math.ceil(
      ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target)),
    );

    const hackThreads = binarySearch(
      1,
      Math.min(maxHackThreads + 1, totalAvailableThreads),
      (hackThreads) => {
        const [growThreads, weakenThreads] = getGrowWeakenThreads(
          target,
          hackThreads,
        );
        return (
          hackThreads + growThreads + weakenThreads <= totalAvailableThreads
        );
      },
    );

    const [growThreads, weakenThreads] = getGrowWeakenThreads(
      target,
      hackThreads,
    );

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
