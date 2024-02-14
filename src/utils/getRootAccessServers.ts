import { scanAll } from "./scanAll.ts";

export function getRootAccessServers(ns: Bitburner.NS) {
  return [...scanAll(ns).filter(ns.hasRootAccess), "home"];
}
