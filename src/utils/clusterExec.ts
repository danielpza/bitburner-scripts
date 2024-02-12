import { getFreeThreads } from "./getFreeThreads";
import { remoteExec } from "./remoteExec";

export function clusterExec(
  ns: Bitburner.NS,
  hosts: string[],
  {
    script,
    threads = 1,
    target,
    delay = 0,
  }: {
    script: string;
    threads?: number;
    target: string;
    delay?: number;
  },
) {
  let pids = [] as number[];
  let missingThreads = threads;
  for (const host of hosts) {
    const freeThreads = getFreeThreads(ns, host, ns.getScriptRam(script));
    if (freeThreads > 0) {
      const threadsToUse = Math.min(freeThreads, missingThreads);
      let pid = remoteExec(ns, {
        script,
        host,
        threads: threadsToUse,
        target,
        delay,
      });
      pids.push(pid);
      missingThreads -= threadsToUse;
    }
    if (missingThreads <= 0) break;
  }
  if (missingThreads > 0) {
    throw new Error("no enough free threads");
  }
}
