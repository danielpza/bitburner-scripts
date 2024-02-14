import { getFreeThreads } from "./getFreeThreads.ts";

export function getClusterFreeThreads(
  ns: Bitburner.NS,
  cluster: string[],
  ram: number,
) {
  return cluster.reduce(
    (acc, server) => acc + getFreeThreads(ns, server, ram),
    0,
  );
}
