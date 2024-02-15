import { Job } from "./constants.ts";
import { getFreeThreads } from "./getFreeThreads.ts";
import { RemoteExecOptions, remoteExec } from "./remoteExec.ts";

/** @deprecated */
export interface ClusterExecOptionsOld {
  script: string;
  threads?: number;
  target: string;
  delay?: number;
}

/** @deprecated */
export function clusterExecOld(
  ns: Bitburner.NS,
  hosts: string[],
  { script, threads = 1, target, delay = 0 }: ClusterExecOptionsOld,
) {
  return clusterExec(ns, hosts, Job.HGW(script, target, threads, delay));
}

export function clusterExec(
  ns: Bitburner.NS,
  hosts: string[],
  { script, args, threads = 1 }: RemoteExecOptions,
) {
  let missingThreads = threads;
  for (const host of hosts) {
    const freeThreads = getFreeThreads(ns, host, ns.getScriptRam(script));
    if (freeThreads > 0) {
      const threadsToUse = Math.min(freeThreads, missingThreads);
      remoteExec(ns, host, {
        script,
        threads: threadsToUse,
        args,
      });
      missingThreads -= threadsToUse;
    }
    if (missingThreads <= 0) break;
  }
  if (missingThreads > 0) {
    throw new Error("no enough free threads");
  }
}
