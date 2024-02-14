import { scanAll } from "./scanAll.ts";

export function getRootAccessServers(ns: Bitburner.NS) {
  return ["home", ...scanAll(ns).filter(ns.hasRootAccess)];
}
