import { getFreeRam } from "./getFreeRam";

export function getFreeThreads(
  ns: Bitburner.NS,
  host: string,
  ramCost: number,
) {
  return Math.floor(getFreeRam(ns, host) / ramCost);
}
