import { clusterExec, getFreeThreads, scanAll, ProcessCleanup } from "./shared";

const SLEEP = 200;

const WEAK_ANALYZE = 0.05; // ns.weakenAnalyze(1);

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  const pcleanup = new ProcessCleanup();
  pcleanup.setup(ns);

  const RAM = Math.max(
    ns.getScriptRam("scripts/dummy-hack.js"),
    ns.getScriptRam("scripts/dummy-grow.js"),
    ns.getScriptRam("scripts/dummy-weaken.js"),
  );

  let blackList = new Set<string>([]);

  const hosts = scanAll(ns);

  for (;;) {
    Promise.all(
      _.sortBy(
        hosts.filter(
          (host) =>
            !blackList.has(host) &&
            canLowerSecurity(host) &&
            ns.getWeakenTime(host) < 1000 * 60 * 10,
        ),
        (target) => ns.getWeakenTime(target),
      ).map(async (target) => {
        const availableThreads = getAvailableThreads();

        if (availableThreads === 0) return;

        blackList.add(target);

        const totalTime = ns.getWeakenTime(target);

        const currentSecurity = ns.getServerSecurityLevel(target);
        const minSecurity = ns.getServerMinSecurityLevel(target);

        const secToRemove = currentSecurity - minSecurity;

        const weakenThreads = Math.ceil(secToRemove / WEAK_ANALYZE);

        const pids = clusterExec(ns, getRootAccessServers(ns), {
          script: "scripts/dummy-weaken.js",
          target,
          threads: Math.min(availableThreads, weakenThreads),
        });

        pcleanup.add(pids);

        ns.print(
          [
            `weakening ${target}`,
            ns.formatNumber(ns.getServerSecurityLevel(target)) +
              "/" +
              ns.formatNumber(ns.getServerMinSecurityLevel(target)),
            `(${weakenThreads})`,
            ns.tFormat(totalTime),
          ].join(" "),
        );

        await ns.asleep(totalTime);

        ns.print(`weakened ${target}`);

        pcleanup.remove(pids);
      }),
    );

    await ns.asleep(SLEEP);
  }

  function canLowerSecurity(target: string) {
    return (
      ns.hasRootAccess(target) &&
      ns.getServerMinSecurityLevel(target) < ns.getServerSecurityLevel(target)
    );
  }

  function getRootAccessServers(ns: Bitburner.NS) {
    let servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
    return servers;
  }

  function getAvailableThreads() {
    return getRootAccessServers(ns).reduce(
      (acc, server) => acc + getFreeThreads(ns, server, RAM),
      0,
    );
  }
}
