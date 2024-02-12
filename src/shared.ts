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
  let pids = [] as number[];
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
  return pids;
}

export function remoteExec(
  ns: Bitburner.NS,
  {
    script,
    host,
    threads,
    target,
    delay = 0,
  }: {
    script: string;
    host: string;
    threads?: number;
    target: string;
    delay?: number;
  },
) {
  ns.scp(script, host);
  return ns.exec(script, host, { threads }, target, "--delay", delay);
}

export function getFreeRam(ns: Bitburner.NS, host: string) {
  const total = ns.getServerMaxRam(host);
  const used = ns.getServerUsedRam(host);
  return total - used;
}

export function getFreeThreads(ns: Bitburner.NS, host: string, ram: number) {
  return Math.floor(getFreeRam(ns, host) / ram);
}
