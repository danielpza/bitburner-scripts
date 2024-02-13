import { getFreeRam } from "./getFreeRam.ts";

export function getFreeThreads(ns: Bitburner.NS, host: string, ram: number) {
  return Math.floor(getFreeRam(ns, host) / ram);
}
