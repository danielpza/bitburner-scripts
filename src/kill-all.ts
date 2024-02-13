import { scanAll } from "./utils/scanAll.ts";

export function main(ns: Bitburner.NS) {
  const servers = scanAll(ns).filter(
    (server) => ns.hasRootAccess(server) && server !== ns.getHostname(),
  );
  for (const server of servers) {
    ns.killall(server);
  }
}
