import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { clusterExec } from "./utils/clusterExec.ts";
import { SLEEP, Script, WEAK_ANALYZE } from "./utils/constants.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");
  ns.tail();
  ns.resizeTail(700, 120);

  await weakenTarget(ns, target, { loop: true });
}

export async function weakenTarget(
  ns: Bitburner.NS,
  target: string,
  { loop = false }: { loop?: boolean } = {},
) {
  const ram = ns.getScriptRam(Script.WEAKEN);

  do {
    const currentSecurity = ns.getServerSecurityLevel(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);

    const secToRemove = currentSecurity - minSecurity;

    if (secToRemove <= 0) {
      break;
    }

    const servers = getRootAccessServers(ns);
    const freeThreads = getClusterFreeThreads(ns, servers, ram);

    const totalTime = ns.getWeakenTime(target);
    const weakenThreads = Math.ceil(secToRemove / WEAK_ANALYZE);

    clusterExec(ns, servers, {
      script: Script.WEAKEN,
      target,
      threads: Math.min(freeThreads, weakenThreads),
    });

    ns.print(
      [
        `weakening ${target}`,
        ns.formatNumber(ns.getServerSecurityLevel(target)) +
          "/" +
          ns.formatNumber(ns.getServerMinSecurityLevel(target)),
        `(${weakenThreads})`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    await ns.asleep(totalTime + SLEEP);

    ns.print(`weakened ${target}`);
  } while (loop);
}

export function getRequiredWeakenThreads(ns: Bitburner.NS, target: string) {
  const currentSecurity = ns.getServerSecurityLevel(target);
  const minSecurity = ns.getServerMinSecurityLevel(target);

  const secToRemove = currentSecurity - minSecurity;

  return Math.ceil(secToRemove / WEAK_ANALYZE);
}
