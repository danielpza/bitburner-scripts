import { scanAll } from "./utils/scanAll.ts";
import { stackTail } from "./utils/stackTail.ts";

export async function main(ns: Bitburner.NS) {
  const loop = ns.args.includes("--loop");

  ns.disableLog("ALL");

  if (loop) stackTail(ns, 1);

  do {
    nukeAll(ns);
  } while (loop && (await ns.asleep(1000)));
}

export function nukeAll(ns: Bitburner.NS) {
  const servers = scanAll(ns).filter((server) => !ns.hasRootAccess(server));
  for (const target of servers) {
    if (nukeTarget(ns, target)) {
      ns.print(`Nuked ${target}`);
    }
  }
}

export function nukeTarget(ns: Bitburner.NS, target: string) {
  for (const op of [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject]) {
    try {
      op(target);
    } catch (e) {}
  }
  try {
    ns.nuke(target);
    return true;
  } catch (e) {
    return false;
  }
}
