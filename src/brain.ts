import { nukeAll } from "./nuke-all.ts";
import { weakenGrowTarget } from "./weaken-grow.ts";
import { tryPurchaseServer, tryUpgradeServer } from "./servers.ts";
import { hackTarget } from "./hack.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

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
    await hackTarget(ns, target);

    await ns.asleep(1500);
  }

  function getHackTarget() {
    return "n00dles";
  }
}
