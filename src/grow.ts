import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { clusterExec } from "./utils/clusterExec.ts";
import { GROW_PER_WEAK, SLEEP, Script, Jobs } from "./utils/constants.ts";
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

export async function growTarget(ns: Bitburner.NS, target: string, { extraDelay = 0, loop = false } = {}) {
  const ram = Math.max(ns.getScriptRam(Script.GROW), ns.getScriptRam(Script.WEAKEN));

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

    if (growThreads === 0 || weakenThreads === 0) continue;

    const growTime = ns.getGrowTime(target) + SLEEP;
    const weakenTime = ns.getWeakenTime(target);
    const totalTime = Math.max(growTime, weakenTime) + extraDelay;

    const growDelay = totalTime - growTime;
    const weakenDelay = totalTime - weakenTime;

    clusterExec(ns, cluster, Jobs.Grow(growThreads, target, growDelay));
    clusterExec(ns, cluster, Jobs.Weaken(weakenThreads, target, weakenDelay));

    ns.print(
      [
        `growing ${target}`,
        ns.formatNumber(ns.getServerMoneyAvailable(target)) + "/" + ns.formatNumber(ns.getServerMaxMoney(target)),
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

  return Math.ceil(ns.growthAnalyze(target, maxMoney / Math.max(currentMoney, 1)));
}

export function getRequiredGWThreads(
  ns: Bitburner.NS,
  { target, maxThreads = Infinity }: { target: string; maxThreads?: number },
) {
  let growThreads = getRequiredGrowThreads(ns, target);
  let weakenThreads = Math.ceil(growThreads / GROW_PER_WEAK);

  // ns.print(`getRequiredGWThreads(${target}, ${maxThreads}) = ${growThreads} + ${weakenThreads}`);

  let totalThreads = growThreads + weakenThreads;

  let optimal = true;
  if (totalThreads > maxThreads) {
    optimal = false;
    const ratio = maxThreads / totalThreads;
    weakenThreads = Math.ceil(weakenThreads * ratio);
    growThreads = maxThreads - weakenThreads;
  }

  totalThreads = growThreads + weakenThreads;

  if (growThreads === 0 || weakenThreads === 0) return null;

  return { growThreads, weakenThreads, totalThreads, optimal };
}
