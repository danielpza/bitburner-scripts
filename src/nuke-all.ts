import { scanAll } from "./utils/scanAll.ts";

export function main(ns: Bitburner.NS) {
  nukeAll(ns);
}

export function nukeAll(ns: Bitburner.NS) {
  const servers = scanAll(ns).filter((server) => !ns.hasRootAccess(server));
  for (const target of servers) {
    if (nukeTarget(ns, target)) {
      ns.tprint(`Nuked ${target}`);
    }
  }
}

export function nukeTarget(ns: Bitburner.NS, target: string) {
  for (const op of [
    "brutessh",
    "ftpcrack",
    "relaysmtp",
    "httpworm",
    "sqlinject",
  ] as const) {
    try {
      ns[op](target);
    } catch (e) {}
  }
  try {
    ns.nuke(target);
    return true;
  } catch (e) {
    return false;
  }
}
