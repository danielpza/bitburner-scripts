import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { clusterExecOld } from "./utils/clusterExec.ts";
import { GROW_PER_WEAK, SLEEP, Script } from "./utils/constants.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");
  ns.tail();
  ns.resizeTail(700, 120);

  await growTarget(ns, target);
}

export async function growTarget(
  ns: Bitburner.NS,
  target: string,
  { extraDelay = 0, loop = false } = {},
) {
  const ram = Math.max(
    ns.getScriptRam(Script.GROW),
    ns.getScriptRam(Script.WEAKEN),
  );

  do {
    let growThreads = getRequiredGrowThreads(ns, target);

    if (growThreads == 0) {
      break;
    }

    const cluster = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, cluster, ram);

    let weakenThreads = Math.ceil(growThreads / GROW_PER_WEAK);
    let targetTotalThreads = growThreads + weakenThreads;

    if (targetTotalThreads > freeThreads) {
      const ratio = freeThreads / targetTotalThreads;
      weakenThreads = Math.ceil(weakenThreads * ratio);
      growThreads = freeThreads - weakenThreads;
    }

    const growTime = ns.getGrowTime(target) + SLEEP;
    const weakenTime = ns.getWeakenTime(target);
    const totalTime = Math.max(growTime, weakenTime) + extraDelay;

    const growDelay = totalTime - growTime;
    const weakenDelay = totalTime - weakenTime;

    const sexec = (script: string, threads: number, delay: number) =>
      clusterExecOld(ns, cluster, { script, target, threads, delay });

    sexec(Script.GROW, growThreads, growDelay);
    sexec(Script.WEAKEN, weakenThreads, weakenDelay);

    ns.print(
      [
        `growing ${target}`,
        ns.formatNumber(ns.getServerMoneyAvailable(target)) +
          "/" +
          ns.formatNumber(ns.getServerMaxMoney(target)),
        `(${growThreads}, ${weakenThreads})`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    await ns.asleep(totalTime + SLEEP);

    ns.print(`grown ${target}`);
  } while (loop);
}

export function getRequiredGrowThreads(ns: Bitburner.NS, target: string) {
  const currentMoney = ns.getServerMoneyAvailable(target);
  const maxMoney = ns.getServerMaxMoney(target);

  if (currentMoney === maxMoney) return 0;

  return Math.ceil(
    ns.growthAnalyze(
      target,
      Math.min(Number.MAX_SAFE_INTEGER, maxMoney / Math.max(currentMoney, 1)),
    ),
  );
}

export function canFullyGrow(ns: Bitburner.NS, target: string) {
  return (
    getRequiredGrowThreads(ns, target) <=
    getClusterFreeThreads(
      ns,
      getRootAccessServers(ns),
      ns.getScriptRam(Script.WEAKEN),
    )
  );
}
