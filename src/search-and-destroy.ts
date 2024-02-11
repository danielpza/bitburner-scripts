import { scanAll } from "./utils/scanAll";

export function main(ns: Bitburner.NS) {
  const servers = scanAll(ns).filter((server) => !ns.hasRootAccess(server));
  for (const target of servers) {
    try {
      ns.brutessh(target);
    } catch (e) {}
    try {
      ns.nuke(target);
      ns.tprint(`Nuked ${target}`);
    } catch (e) {}
  }
}
