import { getFreeThreads } from "./getFreeThreads.ts";
import { RemoteExec2Options, remoteExec, remoteExec2 } from "./remoteExec.ts";

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

export function clusterExec2(
  ns: Bitburner.NS,
  hosts: string[],
  { script, args, threads = 1 }: RemoteExec2Options,
) {
  let missingThreads = threads;
  for (const host of hosts) {
    const freeThreads = getFreeThreads(ns, host, ns.getScriptRam(script));
    if (freeThreads > 0) {
      const threadsToUse = Math.min(freeThreads, missingThreads);
      remoteExec2(ns, host, {
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
