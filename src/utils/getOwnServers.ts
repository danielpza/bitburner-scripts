import { scanAll } from "./scanAll.ts";

export function getOwnServers(ns: Bitburner.NS) {
  return [...scanAll(ns).filter((server) => ns.hasRootAccess(server) && server.startsWith("purchased_server_"))];
}
