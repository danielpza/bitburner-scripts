import { scanAll } from "./utils/scanAll.ts";
import { stackTail } from "./utils/stackTail.ts";
import { Script } from "./utils/constants.ts";

export async function main(ns: NS) {
  const loop = ns.args.includes("--loop");

  ns.disableLog("ALL");

  if (loop) stackTail(ns, 1);

  do {
    for (const target of nukeAll(ns)) {
      ns.print(`Nuked ${target}`);
    }
  } while (loop && (await ns.asleep(1000)));
}

export function* nukeAll(ns: Bitburner.NS) {
  for (const target of scanAll(ns)) {
    if (ns.hasRootAccess(target)) ns.scp(Object.values(Script), target);
    else if (nukeTarget(ns, target)) {
      yield target;
      ns.scp(Object.values(Script), target);
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
