export function main(ns: Bitburner.NS) {
  const servers = ns.scan().filter((server) => !ns.hasRootAccess(server));
  for (const target of servers) {
    try {
      ns.brutessh(target);
    } catch (e) {}
    try {
      ns.nuke(target);
    } catch (e) {}
  }
}
