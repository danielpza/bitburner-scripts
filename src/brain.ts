import { clusterExec } from "./utils/clusterExec.ts";
import { Jobs, MAX_SHARE_THREADS, SHARE_FILE, SLEEP, ShareToggle } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { scanAll } from "./utils/scanAll.ts";

import { getRequiredGWThreads, getRequiredGrowThreads, growTarget } from "./grow.ts";
import { hackTarget } from "./hack.ts";
import { getServerInfo } from "./info.ts";
import { getRequiredWeakenThreads, weakenTarget } from "./weaken.ts";
import { hgwAnalyze } from "./utils/hgwAnalyze.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  const RAM = ns.getScriptRam(Jobs.Weaken.script);

  let managing = new Set<string>();

  while (true) {
    ns.print("--> main loop <--");
    const ranked = getRankedServers().filter((server) => server.canHack);
    let [firstTarget, ...secondaryTargets] = ranked;

    if (managing.has(firstTarget?.name)) {
      [firstTarget, ...secondaryTargets] = ranked.filter(
        (server) => !managing.has(server.name) && server.weakenTime < firstTarget.weakenTime + SLEEP * 2,
      );
    }

    if (!firstTarget) {
      await ns.asleep(1000);
      continue;
    }
    ns.setTitle(`${firstTarget.name} - ${ns.tFormat(firstTarget.weakenTime)}`);

    const { name: target, weakenTime } = firstTarget;

    const cluster = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, cluster, RAM);

    const weakenThreads = getRequiredWeakenThreads(ns, target);
    const growThreads = getRequiredGWThreads(ns, { target })?.totalThreads ?? 0;
    const targetHackPercent = getHackPercent(ns, target);
    const hackThreads = hgwAnalyze(ns, target, targetHackPercent).totalThreads;

    const canFullHack = weakenThreads + growThreads + hackThreads <= freeThreads;

    await useUpThreads(handleServer(target, { targetHackPercent }));
    await ns.asleep(1500);

    async function useUpThreads(promise: Promise<unknown>) {
      // return promise;
      if (isSharing()) return Promise.all([whileUnresolved(promise, () => shareAll(ns)), weakenOthers(), hackOthers()]);
      // else return whileUnresolved(Promise.all([promise, hackOthers()]), () => shareAll(ns));
      else return Promise.all([promise, weakenOthers(), hackOthers()]);
    }

    function weakenOthers() {
      for (const otherTarget of secondaryTargets) {
        if (getClusterFreeThreads(ns, cluster, RAM) < 5) break;
        handleServer(otherTarget.name, { onlyWeaken: true });
      }
    }
    function hackOthers() {
      for (const otherTarget of secondaryTargets) {
        if (getClusterFreeThreads(ns, cluster, RAM) < 5) break;
        const canWeakenBefore = otherTarget.weakenTime < weakenTime - SLEEP * 2;
        handleServer(otherTarget.name, { onlyWeaken: !(canFullHack || canWeakenBefore) });
      }
    }
  }

  async function handleServer(
    target: string,
    { onlyWeaken = false, targetHackPercent }: { onlyWeaken?: boolean; targetHackPercent?: number } = {},
  ) {
    if (managing.has(target)) {
      return;
    }
    managing.add(target);

    const hasToWeaken = getRequiredWeakenThreads(ns, target) > 0;
    const hasToGrow = !onlyWeaken && getRequiredGrowThreads(ns, target) > 0;

    const weakenDelay = hasToWeaken ? SLEEP : 0;
    const growDelay = hasToGrow ? SLEEP * 3 : 0;

    await Promise.all([
      hasToWeaken && weakenTarget(ns, target),
      hasToGrow && growTarget(ns, target, { extraDelay: weakenDelay }),
      !onlyWeaken &&
        !hasToGrow &&
        !hasToWeaken &&
        hackTarget(ns, target, { extraDelay: weakenDelay + growDelay, targetHackPercent }),
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

  const freeThreads = Math.min(
    getClusterFreeThreads(ns, cluster, ns.getScriptRam(Jobs.Share.script)),
    MAX_SHARE_THREADS,
  );

  if (freeThreads) {
    ns.print(`sharing ${freeThreads}`);
    clusterExec(ns, cluster, Jobs.Share(freeThreads));
    return ns.asleep(10_100);
  } else {
    return ns.asleep(1000);
  }
}

function getHackPercent(ns: Bitburner.NS, target: string) {
  let percents = [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.9].reverse();
  const freeThreads = getClusterFreeThreads(ns, getRootAccessServers(ns), ns.getScriptRam(Jobs.Hack.script));

  return _.maxBy(percents, (percent) => {
    const threads = hgwAnalyze(ns, target, percent);

    const currentMoney = ns.getServerMoneyAvailable(target);
    const moneyStolen = currentMoney * percent;

    // ns.print(`percent: ${percent} | threads: ${threads.totalThreads} | money: ${moneyStolen}`);

    if (freeThreads < threads.totalThreads) return 0;

    return moneyStolen / threads.totalThreads;
  })!;
}
