import { SLEEP, Script } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { scanAll } from "./utils/scanAll.ts";
import { weakenTarget } from "./weaken.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  const RAM = ns.getScriptRam(Script.WEAKEN);

  let blackList = new Set<string>([]);

  const hosts = scanAll(ns);

  for (;;) {
    const cluster = getRootAccessServers(ns);
    const possibleTargets = hosts.filter(
      (host) =>
        !blackList.has(host) &&
        canLowerSecurity(host) &&
        ns.getWeakenTime(host) < 1000 * 60 * 20,
    );
    const sortedTargets = _.sortBy(possibleTargets, ns.getWeakenTime);
    Promise.all(
      sortedTargets.map(async (target) => {
        const availableThreads = getClusterFreeThreads(ns, cluster, RAM);

        if (availableThreads === 0) return;

        blackList.add(target);

        await weakenTarget(ns, target);
      }),
    );

    await ns.asleep(SLEEP * 5);
  }

  function canLowerSecurity(target: string) {
    return (
      ns.hasRootAccess(target) &&
      ns.getServerMinSecurityLevel(target) < ns.getServerSecurityLevel(target)
    );
  }
}
