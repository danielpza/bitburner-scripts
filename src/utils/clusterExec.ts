import { getFreeThreads } from "./getFreeThreads.ts";
import { remoteExec } from "./remoteExec.ts";

export interface ClusterExecOptions {
  script: string;
  threads?: number;
  target: string;
  delay?: number;
}

export function clusterExec(
  ns: Bitburner.NS,
  hosts: string[],
  { script, threads = 1, target, delay = 0 }: ClusterExecOptions,
) {
  let missingThreads = threads;
  for (const host of hosts) {
    const freeThreads = getFreeThreads(ns, host, ns.getScriptRam(script));
    if (freeThreads > 0) {
      const threadsToUse = Math.min(freeThreads, missingThreads);
      remoteExec(ns, {
        script,
        host,
        threads: threadsToUse,
        target,
        delay,
      });
      missingThreads -= threadsToUse;
    }
    if (missingThreads <= 0) break;
  }
  if (missingThreads > 0) {
    throw new Error("no enough free threads");
  }
}
