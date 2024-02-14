import { growTarget } from "./grow.ts";
import { SLEEP, Script } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { getRequiredWeakenThreads, weakenTarget } from "./weaken.ts";

export async function weakenGrowTarget(ns: Bitburner.NS, target: string) {
  while (!canFullyWeaken(target)) await weakenTarget(ns, target);

  await Promise.all([
    weakenTarget(ns, target),
    growTarget(ns, target, { extraDelay: SLEEP * 2 }),
  ]);

  function canFullyWeaken(target: string) {
    const servers = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(
      ns,
      servers,
      ns.getScriptRam(Script.WEAKEN),
    );

    return getRequiredWeakenThreads(ns, target) <= freeThreads;
  }
}
