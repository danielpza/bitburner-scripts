import { clusterExec } from "./utils/clusterExec.ts";
import { Jobs, SHARE_FILE, ShareToggle } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { scanAll } from "./utils/scanAll.ts";

import { canFullyGrow, getRequiredGrowThreads, growTarget } from "./grow.ts";
import { hackTarget } from "./hack.ts";
import { getServerInfo } from "./info.ts";
import { stackTail } from "./utils/stackTail.ts";
import { canFullyWeaken, getRequiredWeakenThreads, weakenTarget } from "./weaken.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  stackTail(ns, 0, 800);

  const RAM = ns.getScriptRam(Jobs.Weaken.script);

  while (true) {
    const target = getHackTarget();

    while (!canFullyWeaken(ns, target)) await weakenTarget(ns, target);

    if (getRequiredWeakenThreads(ns, target) > 0)
      await useUpThreads(Promise.all([weakenTarget(ns, target), growTarget(ns, target)]));

    while (!canFullyGrow(ns, target)) await Promise.all([growTarget(ns, target), weakenAll(target)]);

    if (getRequiredGrowThreads(ns, target) > 0) await useUpThreads(growTarget(ns, target));

    await useUpThreads(hackTarget(ns, target));

    await ns.asleep(1500);

    async function useUpThreads(promise: Promise<unknown>) {
      if (isSharing()) await whileUnresolved(promise, () => shareAll(ns));
      else await Promise.all([promise, weakenAll(target)]);
    }
  }

  async function weakenAll(target: string) {
    const cluster = getRootAccessServers(ns);

    const servers = getRankedServers()
      .filter((server) => server.hasSkill)
      .reverse()
      .slice(1);
    let freeThreads = getClusterFreeThreads(ns, cluster, RAM);

    for (let server of servers) {
      if (freeThreads === 0) return;

      const requiredThreads = getRequiredWeakenThreads(ns, server.name);
      if (requiredThreads === 0) continue;
      if (freeThreads < requiredThreads) continue;

      clusterExec(ns, cluster, Jobs.Weaken(requiredThreads, server.name));
      freeThreads -= requiredThreads;
    }

    if (freeThreads) return clusterExec(ns, cluster, Jobs.Weaken(freeThreads, target));
  }

  function getRankedServers() {
    const playerHackLevel = ns.getHackingLevel();
    const servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
    const maxThreads = getClusterFreeThreads(ns, servers, RAM);
    const serverInfo = servers
      .filter((server) => ns.getServerMaxMoney(server) > 0)
      .map((server) => getServerInfo(ns, server, { playerHackLevel, maxThreads }));
    return _.sortBy(serverInfo, ["hasSkill", "initialWeakenScore", "moneyPerThread"]);
  }

  function getHackTarget() {
    return getRankedServers().at(-1)!.name;
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
