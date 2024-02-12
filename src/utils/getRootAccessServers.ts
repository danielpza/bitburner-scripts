import { scanAll } from "./scanAll";

export function getRootAccessServers(
  ns: Bitburner.NS,
  { includeHome = false } = {},
) {
  let servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
  if (includeHome) servers.push("home");
  return servers;
}
