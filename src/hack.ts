import { getOptimalSchedule } from "./utils/schedule.ts";
import { scanAll } from "./utils/scanAll.ts";
import { binarySearch } from "./utils/binarySearch.ts";
import { getFreeThreads } from "./utils/getFreeThreads.ts";
import {
  ClusterExecOptions,
  clusterExec as clusterExec2,
} from "./utils/clusterExec.ts";
import { ProcessCleanup } from "./utils/ProcessCleanup.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const SLEEP = 75;
const MAX_CYCLES = 1000;

const HACK_ANALYZE_SEC = 0.002; // ns.hackAnalyzeSecurity(1);
const GROW_ANALYZE_SEC = 0.004; // ns.growthAnalyzeSecurity(1);
const WEAK_ANALYZE = 0.05; // ns.weakenAnalyze(1);

const GROW_PER_WEAK = WEAK_ANALYZE / GROW_ANALYZE_SEC;
const HACK_PER_WEAK = WEAK_ANALYZE / HACK_ANALYZE_SEC;

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  const includeHome = ns.args.includes("--home");

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  const pcleanup = new ProcessCleanup(ns);

  // let title: string = null;
  // let titleTime = 0;

  // let interval = setInterval(() => {
  //   ns.setTitle(`${title} ${ns.tFormat(titleTime)}`);

  //   titleTime -= 1000;
  //   if (titleTime < 0) titleTime = 0;
  // }, 1000);

  const getScriptRam = _.memoize(ns.getScriptRam);

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
    await ns.sleep(1500);
  }

  async function doHack() {
    const threads = getBatchThreadForHackProcess();

    if (!threads) {
      throw new Error(`invalid threads`);
    }

    const { hackThreads, growThreads, weakenThreads } = threads;

    const requiredThreads = hackThreads + growThreads + weakenThreads;

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

    let pids: number[] = [];

    for (
      i = 0;
      i < MAX_CYCLES && requiredThreads <= getAvailableThreads();
      i++
    ) {
      for (const [{ script, threads }, delay] of schedule) {
        pids.push(
          ...clusterExec(ns, {
            script,
            target,
            threads,
            delay: delay + i * SLEEP,
          }),
        );
      }
    }

    const moneyStolen = Math.min(
      ns.hackAnalyze(target) * hackThreads * ns.getServerMoneyAvailable(target),
      ns.getServerMoneyAvailable(target),
    );
    const moneyAvailable = ns.getServerMoneyAvailable(target);

    // title = `hack ${target} x${i}`;
    // titleTime = totalTime;
    ns.setTitle(`hack ${target} x${i} ${ns.tFormat(totalTime)}`);
    ns.print(
      [
        "hacking...",
        ns.formatNumber(moneyStolen) + "/" + ns.formatNumber(moneyAvailable),
        `(${hackThreads}, ${growThreads}, ${weakenThreads})`,
        `x${i}`,
        ns.tFormat(totalTime),
      ].join(" "),
    );

    pcleanup.add(pids, totalTime);
    await ns.asleep(totalTime + SLEEP * i + 1000);
  }

  async function doGrow() {
    let growThreads = Math.ceil(
      ns.growthAnalyze(
        target,
        Math.min(
          Number.MAX_SAFE_INTEGER,
          ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target),
        ),
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

    let pids: number[] = [];

    for (const [{ script, threads }, delay] of schedule) {
      pids.push(
        ...clusterExec(ns, {
          script,
          target,
          threads,
          delay,
        }),
      );
    }

    pcleanup.add(pids, totalTime);
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

    let pids = clusterExec(ns, {
      script: weakenTask.script,
      target,
      threads: Math.min(getAvailableThreads(), weakenThreads),
    });

    pcleanup.add(pids, totalTime);
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

  function getAvailableThreads() {
    return getRootAccessServers(ns).reduce(
      (acc, server) => acc + getFreeThreads(ns, server, RAM),
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

  function clusterExec(ns: Bitburner.NS, options: ClusterExecOptions) {
    const hosts = getRootAccessServers(ns);
    return clusterExec2(ns, hosts, options);
  }

  function getBatchThreadForHackProcess() {
    const maxHackThreads = Math.ceil(
      ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target)),
    );

    const totalAvailableThreads = getAvailableThreads();

    const hackThreads = binarySearch(
      1,
      Math.min(maxHackThreads + 1, totalAvailableThreads),
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

    if (
      hackThreads <= 0 ||
      growThreads <= 0 ||
      weakenThreads <= 0 ||
      hackThreads + growThreads + weakenThreads > totalAvailableThreads
    ) {
      return null;
    }

    return { hackThreads, growThreads, weakenThreads };
  }
}
