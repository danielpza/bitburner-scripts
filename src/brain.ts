import { nukeAll } from "./nuke-all.ts";
import { weakenGrowTarget } from "./weaken-grow.ts";
import { tryPurchaseServer, tryUpgradeServer } from "./servers.ts";
import { hackTarget } from "./hack.ts";
import { GROW_PER_WEAK, HACK_PER_WEAK, Script } from "./utils/constants.ts";
import { scanAll } from "./utils/scanAll.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(800, 120);

  const ram = ns.getScriptRam(Script.WEAKEN);

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

    await weakenGrowTarget(ns, target);
    await hackTarget(ns, target);

    await ns.asleep(1500);
  }

  function getHackTarget() {
    const servers = scanAll(ns).filter(
      (server) => ns.getServerMaxMoney(server) > 0,
    );
    return _.orderBy(servers, [
      (server) => (ns.getWeakenTime(server) < 1000 * 60 * 10 ? 0 : 1),
      (server) => {
        const maxMoney = ns.getServerMaxMoney(server);
        const hackThreads = Math.ceil(1 / ns.hackAnalyze(server));
        const growThreads = Math.ceil(
          ns.growthAnalyze(server, maxMoney / 0.0000000001),
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
