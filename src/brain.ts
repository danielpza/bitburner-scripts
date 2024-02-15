import { nukeAll } from "./nuke-all.ts";
import { tryPurchaseServer, tryUpgradeServer } from "./servers.ts";
import { hackTarget } from "./hack.ts";
import {
  GROW_PER_WEAK,
  HACK_PER_WEAK,
  Script,
  TARGET_HACK_PERCENT,
} from "./utils/constants.ts";
import { scanAll } from "./utils/scanAll.ts";
import { clusterExec } from "./utils/clusterExec.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import {
  canFullyWeaken,
  getRequiredWeakenThreads,
  weakenTarget,
} from "./weaken.ts";
import { canFullyGrow, getRequiredGrowThreads, growTarget } from "./grow.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(800, 120);

  const RAM = ns.getScriptRam(Script.WEAKEN);

  (async () => {
    // secondary thread
    while (true) {
      nukeAll(ns);

      while (tryPurchaseServer(ns));
      while (tryUpgradeServer(ns));

      await ns.asleep(1000);
    }
  })();

  while (true) {
    const target = getHackTarget();

    while (!canFullyWeaken(ns, target))
      await Promise.all([weakenTarget(ns, target), weakenAll(target)]);

    if (getRequiredWeakenThreads(ns, target) > 0)
      await Promise.all([
        weakenTarget(ns, target),
        growTarget(ns, target),
        weakenAll(target),
      ]);

    while (!canFullyGrow(ns, target))
      await Promise.all([growTarget(ns, target), weakenAll(target)]);

    if (getRequiredGrowThreads(ns, target) > 0)
      await Promise.all([growTarget(ns, target), weakenAll(target)]);

    await Promise.all([hackTarget(ns, target), weakenAll(target)]);

    await ns.asleep(1500);
  }

  async function weakenAll(target: string) {
    const cluster = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, cluster, RAM);

    if (freeThreads)
      clusterExec(ns, cluster, {
        script: Script.WEAKEN,
        target,
        threads: freeThreads,
      });
  }

  function getHackTarget() {
    const hackLevel = ns.getHackingLevel();
    const servers = scanAll(ns).filter(
      (server) => ns.getServerMaxMoney(server) > 0 && ns.hasRootAccess(server),
    );
    return _.orderBy(servers, [
      (server) =>
        ns.getServerRequiredHackingLevel(server) < hackLevel / 2 ? 0 : 1,
      (server) => {
        const maxMoney = ns.getServerMaxMoney(server);
        const hackThreads = Math.ceil(
          TARGET_HACK_PERCENT / ns.hackAnalyze(server),
        );
        const growThreads = Math.ceil(
          ns.growthAnalyze(server, 1 / (1 - TARGET_HACK_PERCENT)),
        );
        const weakThreads = Math.ceil(
          hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK,
        );
        const totalThreads = hackThreads + growThreads + weakThreads;
        return -(maxMoney / totalThreads);
      },
    ])[0];
  }
}
