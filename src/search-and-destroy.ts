import { scanAll } from "./utils/scanAll.ts";

export function main(ns: Bitburner.NS) {
  const servers = scanAll(ns).filter((server) => !ns.hasRootAccess(server));
  for (const target of servers) {
    try {
      ns.brutessh(target);
    } catch (e) {}
    try {
      ns.ftpcrack(target);
    } catch (e) {}
    try {
      ns.relaysmtp(target);
    } catch (e) {}
    try {
      ns.httpworm(target);
    } catch (e) {}
    try {
      ns.sqlinject(target);
    } catch (e) {}
    try {
      ns.nuke(target);
      ns.tprint(`Nuked ${target}`);
    } catch (e) {}
  }
}
