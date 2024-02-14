import { nukeAll } from "./nuke-all.ts";
import { weakenGrowTarget } from "./weaken-grow.ts";
import { tryPurchaseServer, tryUpgradeServer } from "./servers.ts";
import { hackTarget } from "./hack.ts";
// import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
// import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { Script } from "./utils/constants.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  const ram = ns.getScriptRam(Script.WEAKEN);

  (async () => {
    // secondary thread
    nukeAll(ns);

    while (tryPurchaseServer(ns));
    while (tryUpgradeServer(ns));

    await ns.asleep(1000);
  })();

  while (true) {
    const target = getHackTarget();

    await weakenGrowTarget(ns, target);
    const hackPromise = hackTarget(ns, target);

    // const cluster = getRootAccessServers(ns);
    // const freeThreads = getClusterFreeThreads(ns, cluster, ram);

    await hackPromise;

    await ns.asleep(1500);
  }

  function getHackTarget() {
    return "n00dles";
  }
}
