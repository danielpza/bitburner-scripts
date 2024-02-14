import { SLEEP, Script, WEAK_ANALYZE } from "./utils/constants.ts";

import { growTarget } from "./grow.ts";
import { hackTarget } from "./hack.ts";
import { weakenTarget } from "./weaken.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  while (true) {
    if (canFullyWeaken(target)) {
      await Promise.all([
        weakenTarget(ns, target),
        growTarget(ns, target, { extraDelay: SLEEP }),
      ]);
    } else {
      await weakenTarget(ns, target);
      await growTarget(ns, target);
    }

    await hackTarget(ns, target);
    await ns.sleep(1500);
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
