import { clusterExec } from "./utils/clusterExec.ts";
import {
  GROW_PER_WEAK,
  HACK_PER_WEAK,
  Jobs,
  TARGET_HACK_PERCENT,
} from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { scanAll } from "./utils/scanAll.ts";

import { canFullyGrow, getRequiredGrowThreads, growTarget } from "./grow.ts";
import { hackTarget } from "./hack.ts";
import { nukeAll } from "./nuke-all.ts";
import { tryPurchaseServer, tryUpgradeServer } from "./servers.ts";
import { buyPrograms } from "./tor.ts";
import {
  canFullyWeaken,
  getRequiredWeakenThreads,
  weakenTarget,
} from "./weaken.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(800, 120);

  await Promise.all([secondaryThread(ns), hackThread(ns)]);
}

async function hackThread(ns: Bitburner.NS) {
  const RAM = ns.getScriptRam(Jobs.Weaken.script);

  while (true) {
    const target = getHackTarget();

    while (!canFullyWeaken(ns, target)) await weakenTarget(ns, target);

    if (getRequiredWeakenThreads(ns, target) > 0) {
      const weakenGrowPromise = Promise.all([
        weakenTarget(ns, target),
        growTarget(ns, target),
      ]);
      await whileUnresolved(weakenGrowPromise, async () => {
        await shareAll();
        await ns.asleep(100);
      });
      await weakenGrowPromise;
    }

    while (!canFullyGrow(ns, target))
      await Promise.all([growTarget(ns, target), weakenAll(target)]);

    if (getRequiredGrowThreads(ns, target) > 0) {
      const growPromise = growTarget(ns, target);
      await whileUnresolved(growPromise, async () => {
        await shareAll();
        await ns.asleep(100);
      });
      await growPromise;
    }

    const hackPromise = hackTarget(ns, target);

    await whileUnresolved(hackPromise, shareAll);

    await hackPromise;

    await ns.asleep(1500);
  }

  async function shareAll() {
    const cluster = getRootAccessServers(ns);

    const freeThreads = getClusterFreeThreads(
      ns,
      cluster,
      ns.getScriptRam(Jobs.Share.script),
    );
    if (freeThreads) {
      ns.print(`sharing ${freeThreads}`);
      clusterExec(ns, cluster, Jobs.Share(freeThreads));
      return ns.asleep(10_100);
    } else {
      return ns.asleep(100);
    }
  }

  async function weakenAll(target: string) {
    const cluster = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, cluster, RAM);

    if (freeThreads)
      return clusterExec(ns, cluster, Jobs.Weaken(freeThreads, target));
  }

  function getHackTarget() {
    const hackLevel = ns.getHackingLevel();
    const servers = scanAll(ns).filter(
      (server) => ns.getServerMaxMoney(server) > 0 && ns.hasRootAccess(server),
    );
    return _.orderBy(servers, [
      (server) =>
        ns.getServerRequiredHackingLevel(server) < hackLevel / 2 ? 0 : 1,
      (server) => Math.floor(ns.getWeakenTime(server) / (1000 * 60 * 5)),
      // (server) => Math.round(Math.log(ns.getWeakenTime(server))),
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

async function secondaryThread(ns: Bitburner.NS) {
  while (true) {
    nukeAll(ns);

    await buyPrograms(ns);

    while (tryPurchaseServer(ns));
    while (tryUpgradeServer(ns));

    await ns.asleep(1000);
  }
}

async function whileUnresolved(
  promise: Promise<unknown>,
  cb: () => Promise<unknown>,
) {
  let unresolved = true;
  promise.finally(() => (unresolved = false));
  let newPromise = Promise.resolve<unknown>(undefined);
  (async () => {
    while (unresolved) {
      newPromise = cb();
      await newPromise;
    }
  })();
  return newPromise;
}
