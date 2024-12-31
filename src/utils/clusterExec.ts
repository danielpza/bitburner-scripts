import { getFreeThreads } from "./getFreeThreads.ts";
import { type RemoteExecOptions, remoteExec } from "./remoteExec.ts";

export function clusterExec(
  ns: Bitburner.NS,
  hosts: string[],
  { script, args, threads = 1 }: RemoteExecOptions,
  { signal }: { signal?: AbortSignal } = {},
) {
  let missingThreads = threads;
  let pids: number[] = [];
  for (const host of hosts) {
    const freeThreads = getFreeThreads(ns, host, ns.getScriptRam(script));
    if (freeThreads > 0) {
      const threadsToUse = Math.min(freeThreads, missingThreads);
      const pid = remoteExec(ns, host, { script, threads: threadsToUse, args });
      pids.push(pid);
      missingThreads -= threadsToUse;
    }
    if (missingThreads <= 0) break;
  }
  signal?.addEventListener("abort", () => {
    for (const pid of pids) ns.kill(pid);
  });
  if (missingThreads > 0) {
    throw new Error("no enough free threads");
  }
}
