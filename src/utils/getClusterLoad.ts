import { Script } from "./constants";
import { getRootAccessServers } from "./getRootAccessServers";

export function getClusterLoad(ns: Bitburner.NS) {
  const RAM = Math.max(ns.getScriptRam(Script.HACK), ns.getScriptRam(Script.GROW), ns.getScriptRam(Script.WEAKEN));
  const cluster = getRootAccessServers(ns);
  let free = 0;
  let total = 0;
  for (const server of cluster) {
    const totalRam = ns.getServerMaxRam(server);
    const usedRam = ns.getServerUsedRam(server);
    const freeRam = totalRam - usedRam;
    free += Math.floor(freeRam / RAM);
    total += Math.floor(totalRam / RAM);
  }
  return { free, total };
}
