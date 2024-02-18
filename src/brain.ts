import { clusterExec } from "./utils/clusterExec.ts";
import { Jobs, SHARE_FILE, SLEEP, ShareToggle } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { scanAll } from "./utils/scanAll.ts";

import { getRequiredGrowThreads, growTarget } from "./grow.ts";
import { hackTarget } from "./hack.ts";
import { getServerInfo } from "./info.ts";
import { stackTail } from "./utils/stackTail.ts";
import { getRequiredWeakenThreads, weakenTarget } from "./weaken.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  stackTail(ns, 0, 800);

  const RAM = ns.getScriptRam(Jobs.Weaken.script);

  let managing = new Set<string>();

  while (true) {
    const [{ name: target, weakenTime }, ...secondaryTargets] = getRankedServers();

    const hasToWeaken = getRequiredWeakenThreads(ns, target) > 0;
    const hasToGrow = getRequiredGrowThreads(ns, target) > 0;

    const canHackOthers = !hasToWeaken && !hasToGrow;

    await useUpThreads(handleServer(target, false));

    await ns.asleep(1500);

    async function useUpThreads(promise: Promise<unknown>) {
      if (isSharing()) await whileUnresolved(promise, () => shareAll(ns));
      else {
        for (const otherTarget of secondaryTargets) {
          const canWeakenBefore = otherTarget.weakenTime < weakenTime - SLEEP * 2;
          handleServer(otherTarget.name, !(canHackOthers || canWeakenBefore));
        }
        return promise;
      }
    }
  }

  async function handleServer(target: string, onlyWeaken: boolean) {
    if (!managing.has(target)) {
      return;
    }
    managing.add(target);

    const hasToWeaken = getRequiredWeakenThreads(ns, target) > 0;
    const hasToGrow = !onlyWeaken && getRequiredGrowThreads(ns, target) > 0;

    const weakenDelay = hasToWeaken ? SLEEP : 0;
    const growDelay = hasToGrow ? SLEEP : 0;

    await Promise.all([
      hasToWeaken && weakenTarget(ns, target),
      hasToGrow && growTarget(ns, target, { extraDelay: weakenDelay }),
      !onlyWeaken && hackTarget(ns, target, { extraDelay: weakenDelay + growDelay }),
    ]);

    await ns.asleep(1500);
    managing.delete(target);
  }

  function getRankedServers() {
    const playerHackLevel = ns.getHackingLevel();
    const servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
    const maxThreads = getClusterFreeThreads(ns, servers, RAM);
    const serverInfo = servers
      .filter((server) => ns.getServerMaxMoney(server) > 0)
      .map((server) => getServerInfo(ns, server, { playerHackLevel, maxThreads }));
    return _.sortBy(serverInfo, ["hasSkill", "initialWeakenScore", "moneyPerThread"]).reverse();
  }

  function isSharing() {
    return ns.read(SHARE_FILE) === ShareToggle.on;
  }
}

async function whileUnresolved(promise: Promise<unknown>, cb?: () => Promise<unknown>) {
  if (!cb) return promise;
  let unresolved = true;
  promise.finally(() => (unresolved = false));
  while (unresolved) await cb();
}

async function shareAll(ns: Bitburner.NS) {
  const cluster = getRootAccessServers(ns);

  const freeThreads = getClusterFreeThreads(ns, cluster, ns.getScriptRam(Jobs.Share.script));

  if (freeThreads) {
    ns.print(`sharing ${freeThreads}`);
    clusterExec(ns, cluster, Jobs.Share(freeThreads));
    return ns.asleep(10_100);
  } else {
    return ns.asleep(1000);
  }
}
