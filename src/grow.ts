import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { clusterExec } from "./utils/clusterExec.ts";
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
  { extraDelay = 0 } = {},
) {
  const ram = ns.getScriptRam(Script.GROW);

  while (true) {
    const currentMoney = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);

    const moneyNeeded = maxMoney - currentMoney;

    if (moneyNeeded <= 0) {
      break;
    }

    const servers = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, servers, ram);

    let growThreads = Math.ceil(
      ns.growthAnalyze(
        target,
        Math.min(Number.MAX_SAFE_INTEGER, maxMoney / currentMoney),
      ),
    );
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

    clusterExec(ns, servers, {
      script: Script.GROW,
      target,
      threads: growThreads,
      delay: growDelay,
    });
    clusterExec(ns, servers, {
      script: Script.WEAKEN,
      target,
      threads: weakenThreads,
      delay: weakenDelay,
    });

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
  }
}
