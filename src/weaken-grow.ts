import { growTarget } from "./grow.ts";
import { SLEEP, Script, WEAK_ANALYZE } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { weakenTarget } from "./weaken.ts";

export async function weakenGrowTarget(ns: Bitburner.NS, target: string) {
  if (canFullyWeaken(target)) {
    await Promise.all([
      weakenTarget(ns, target),
      growTarget(ns, target, { extraDelay: SLEEP * 2 }),
    ]);
  } else {
    await weakenTarget(ns, target);
    await growTarget(ns, target);
  }

  function canFullyWeaken(target: string) {
    const currentSecurity = ns.getServerSecurityLevel(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);

    const secToRemove = currentSecurity - minSecurity;

    if (secToRemove <= 0) {
      return true;
    }

    const servers = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(
      ns,
      servers,
      ns.getScriptRam(Script.WEAKEN),
    );

    return Math.ceil(secToRemove / WEAK_ANALYZE) <= freeThreads;
  }
}
