import { getOptimalSchedule } from "./utils/schedule";
import { scanAll } from "./utils/scanAll";
import { binarySearch } from "./utils/binarySearch";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const SLEEP = 100;

function getRootAccessServers(ns: Bitburner.NS) {
  return scanAll(ns).filter(
    (server) => ns.hasRootAccess(server) && server !== "home",
  );
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.tail();

  let pids = [] as number[];

  ns.atExit(() => void pids.forEach(ns.kill));

  ns.disableLog("ALL");

  const getScriptRam = _.memoize(ns.getScriptRam);

  const HACK_ANALYZE_SEC = 0.002; // ns.hackAnalyzeSecurity(1);
  const GROW_ANALYZE_SEC = 0.004; // ns.growthAnalyzeSecurity(1);
  const WEAK_ANALYZE = 0.05; // ns.weakenAnalyze(1);

  const GROW_PER_WEAK = WEAK_ANALYZE / GROW_ANALYZE_SEC;
  const HACK_PER_WEAK = WEAK_ANALYZE / HACK_ANALYZE_SEC;

  const RAM = Math.max(
    getScriptRam("scripts/dummy-hack.js"),
    getScriptRam("scripts/dummy-grow.js"),
    getScriptRam("scripts/dummy-weaken.js"),
  );

  const hackTask = {
    script: "scripts/dummy-hack.js",
    time: (target: string) => ns.getHackTime(target),
    sec: HACK_ANALYZE_SEC,
  };
  const growTask = {
    script: "scripts/dummy-grow.js",
    time: (target: string) => ns.getGrowTime(target),
    sec: GROW_ANALYZE_SEC,
  };
  const weakenTask = {
    script: "scripts/dummy-weaken.js",
    time: (target: string) => ns.getWeakenTime(target),
    sec: WEAK_ANALYZE,
  };

  for (;;) {
    if (canLowerSecurity()) await doWeaken();
    else if (canGrow()) await doGrow();
    else await doHack();
    pids = [];
  }

  async function doHack() {
    const totalThreads = getAvailableThreads();

    const hackThreads = binarySearch(
      1,
      Math.min(
        totalThreads,
        Math.ceil(
          ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target)),
        ),
      ),
      (hackThreads) => {
        const [growThreads, weakenThreads] = getGrowWeakenThreads(
          target,
          hackThreads,
        );
        return hackThreads + growThreads + weakenThreads <= totalThreads;
      },
    );

    const [growThreads, weakenThreads] = getGrowWeakenThreads(
      target,
      hackThreads,
    );

    if (
      hackThreads <= 0 ||
      growThreads <= 0 ||
      weakenThreads <= 0 ||
      hackThreads + growThreads + weakenThreads > totalThreads
    ) {
      throw new Error("invalid threads");
    }

    const { schedule, totalTime } = getOptimalSchedule(
      [
        { ...hackTask, threads: hackThreads },
        { ...growTask, threads: growThreads },
        { ...weakenTask, threads: weakenThreads },
      ],
      (task) => task.time(target),
      SLEEP,
    );

    ns.print(
      [
        "hacking...",
        ns.formatNumber(
          ns.hackAnalyze(target) *
            hackThreads *
            ns.getServerMoneyAvailable(target),
        ) +
          "/" +
          ns.formatNumber(ns.getServerMoneyAvailable(target)),
        `(${hackThreads}, ${growThreads}, ${weakenThreads})`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    for (const [{ script, threads }, delay] of schedule) {
      clusterExec({ script, target, threads, delay });
    }

    await ns.asleep(totalTime);
  }

  async function doGrow() {
    const freeThreads = getAvailableThreads();
    const fullOpThreads = GROW_PER_WEAK + 1;
    const ratio = freeThreads / fullOpThreads;
    const weakenThreads = Math.ceil(ratio);
    const growThreads = freeThreads - weakenThreads;

    const { schedule, totalTime } = getOptimalSchedule(
      [
        { ...growTask, threads: growThreads },
        { ...weakenTask, threads: weakenThreads },
      ],
      (task) => task.time(target),
      SLEEP,
    );

    ns.print(
      [
        "growing...",
        ns.formatNumber(ns.getServerMoneyAvailable(target)) +
          "/" +
          ns.formatNumber(ns.getServerMaxMoney(target)),
        `(${growThreads}, ${weakenThreads})`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    for (const [{ script, threads }, delay] of schedule) {
      clusterExec({ script, target, threads, delay });
    }

    await ns.asleep(totalTime);
  }

  async function doWeaken() {
    ns.print(
      [
        "weakening...",
        ns.formatNumber(ns.getServerSecurityLevel(target)) +
          "/" +
          ns.formatNumber(ns.getServerMinSecurityLevel(target)),
        ns.tFormat(ns.getWeakenTime(target)),
      ].join(" "),
    );
    clusterExec({
      script: weakenTask.script,
      target,
      threads: getAvailableThreads(),
    });
    await ns.asleep(ns.getWeakenTime(target) + SLEEP);
  }

  function canLowerSecurity() {
    return (
      ns.getServerMinSecurityLevel(target) < ns.getServerSecurityLevel(target)
    );
  }

  function canGrow() {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target);
  }

  function clusterExec({
    script,
    threads = 1,
    target,
    delay = 0,
  }: {
    script: string;
    threads?: number;
    target: string;
    delay?: number;
  }) {
    const hosts = getRootAccessServers(ns);
    let missingThreads = threads;
    for (const host of hosts) {
      const freeThreads = getFreeThreads(host);
      if (freeThreads > 0) {
        const threadsToUse = Math.min(freeThreads, missingThreads);
        let pid = remoteExec({
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

  function remoteExec({
    script,
    host,
    threads = 1,
    target,
    delay = 0,
  }: {
    script: string;
    host: string;
    threads?: number;
    target: string;
    delay?: number;
  }) {
    ns.scp(script, host);
    return ns.exec(script, host, { threads }, target, "--delay", delay);
  }

  function getFreeRam(host: string) {
    const total = ns.getServerMaxRam(host);
    const used = ns.getServerUsedRam(host);
    return total - used;
  }

  function getFreeThreads(host: string) {
    return Math.floor(getFreeRam(host) / RAM);
  }

  function getAvailableThreads() {
    return getRootAccessServers(ns).reduce(
      (acc, server) => acc + getFreeThreads(server),
      0,
    );
  }

  function getGrowWeakenThreads(target: string, hackThreads: number) {
    const percentStolen = ns.hackAnalyze(target) * hackThreads;
    const growThreads = Math.ceil(
      ns.growthAnalyze(
        target,
        1 / (1 - _.clamp(percentStolen, 0, 1 - Number.EPSILON)),
      ),
    );
    const weakenThreads = Math.ceil(
      hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK,
    );
    return [growThreads, weakenThreads];
  }
}
