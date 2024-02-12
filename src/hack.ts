import { getOptimalSchedule } from "./utils/schedule";
import { scanAll } from "./utils/scanAll";
import { binarySearch } from "./utils/binarySearch";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const SLEEP = 200;

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  const includeHome = ns.args.includes("--home");

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  let pids = [] as number[];

  // let title: string = null;
  // let titleTime = 0;

  // let interval = setInterval(() => {
  //   ns.setTitle(`${title} ${ns.tFormat(titleTime)}`);

  //   titleTime -= 1000;
  //   if (titleTime < 0) titleTime = 0;
  // }, 1000);

  ns.atExit(() => {
    pids.forEach(ns.kill);
    // clearInterval(interval);
  });

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
    const totalAvailableThreads = getAvailableThreads();

    const maxHackThreads = Math.ceil(
      ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target)),
    );

    const hackThreads = binarySearch(
      1,
      Math.min(totalAvailableThreads, maxHackThreads),
      (hackThreads) => {
        const [growThreads, weakenThreads] = getGrowWeakenThreads(
          target,
          hackThreads,
        );
        return (
          hackThreads + growThreads + weakenThreads <= totalAvailableThreads
        );
      },
    );

    const [growThreads, weakenThreads] = getGrowWeakenThreads(
      target,
      hackThreads,
    );

    const requiredThreads = hackThreads + growThreads + weakenThreads;

    if (
      hackThreads <= 0 ||
      growThreads <= 0 ||
      weakenThreads <= 0 ||
      requiredThreads > totalAvailableThreads
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

    let i;

    for (
      i = 0;
      i < totalTime / SLEEP && requiredThreads <= getAvailableThreads();
      i++
    ) {
      for (const [{ script, threads }, delay] of schedule) {
        clusterExec({ script, target, threads, delay });
      }
      await ns.sleep(SLEEP);
    }

    // title = `hack ${target} x${i}`;
    // titleTime = totalTime;
    ns.setTitle(`hack ${target} x${i} ${ns.tFormat(totalTime)}`);
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
        `x${i}`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    await ns.asleep(totalTime);
  }

  async function doGrow() {
    let growThreads = Math.ceil(
      ns.growthAnalyze(
        target,
        ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target),
      ),
    );
    let weakenThreads = Math.ceil(growThreads / GROW_PER_WEAK);
    let targetTotalThreads = growThreads + weakenThreads;

    const freeThreads = getAvailableThreads();

    if (targetTotalThreads > freeThreads) {
      const ratio = freeThreads / targetTotalThreads;
      weakenThreads = Math.ceil(weakenThreads * ratio);
      growThreads = freeThreads - weakenThreads;
    }

    const { schedule, totalTime } = getOptimalSchedule(
      [
        { ...growTask, threads: growThreads },
        { ...weakenTask, threads: weakenThreads },
      ],
      (task) => task.time(target),
      SLEEP,
    );

    // title = `grow ${target}`;
    // titleTime = totalTime;
    ns.setTitle(`grow ${target} ${ns.tFormat(totalTime)}`);
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

    await ns.asleep(totalTime + SLEEP);
  }

  async function doWeaken() {
    const totalTime = ns.getWeakenTime(target);

    const currentSecurity = ns.getServerSecurityLevel(target);
    const minSecurity = ns.getServerMinSecurityLevel(target);

    const secToRemove = currentSecurity - minSecurity;

    const weakenThreads = Math.ceil(secToRemove / WEAK_ANALYZE);

    // title = `weak ${target}`;
    // titleTime = totalTime;
    ns.setTitle(`weak ${target} ${ns.tFormat(totalTime)}`);
    ns.print(
      [
        "weakening...",
        ns.formatNumber(ns.getServerSecurityLevel(target)) +
          "/" +
          ns.formatNumber(ns.getServerMinSecurityLevel(target)),
        `(${weakenThreads})`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    clusterExec({
      script: weakenTask.script,
      target,
      threads: Math.min(getAvailableThreads(), weakenThreads),
    });

    await ns.asleep(totalTime + SLEEP);
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

  function getRootAccessServers(ns: Bitburner.NS) {
    let servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
    if (includeHome) servers.push("home");
    return servers;
  }
}
