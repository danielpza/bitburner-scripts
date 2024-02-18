import { getFreeThreads } from "./getFreeThreads.ts";
import { RemoteExecOptions, remoteExec } from "./remoteExec.ts";

export function clusterExec(ns: Bitburner.NS, hosts: string[], { script, args, threads = 1 }: RemoteExecOptions) {
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
