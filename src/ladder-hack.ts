import { getOptimalSchedule } from "./schedule";
import { scanAll } from "./utils/scanAll";

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

  ns.disableLog("ALL");

  const getScriptRam = _.memoize(ns.getScriptRam);

  let pids: number[] = [];

  const HACK_ANALYZE_SEC = ns.hackAnalyzeSecurity(1);
  const GROW_ANALYZE_SEC = ns.growthAnalyzeSecurity(1);
  const WEAK_ANALYZE = ns.weakenAnalyze(1);

  const GROW_PER_WEAK = WEAK_ANALYZE / GROW_ANALYZE_SEC;
  const HACK_PER_WEAK = WEAK_ANALYZE / HACK_ANALYZE_SEC;

  const hackTask = {
    script: "scripts/dummy-hack.js",
    time: (target: string) => ns.getHackTime(target),
    ram: getScriptRam("scripts/dummy-hack.js"),
    sec: HACK_ANALYZE_SEC,
  };
  const growTask = {
    script: "scripts/dummy-grow.js",
    time: (target: string) => ns.getGrowTime(target),
    ram: getScriptRam("scripts/dummy-grow.js"),
    sec: GROW_ANALYZE_SEC,
  };
  const weakenTask = {
    script: "scripts/dummy-weaken.js",
    time: (target: string) => ns.getWeakenTime(target),
    ram: getScriptRam("scripts/dummy-weaken.js"),
    sec: WEAK_ANALYZE,
  };

  ns.atExit(() => {
    for (const pid of pids) {
      ns.kill(pid);
    }
  });

  for (;;) {
    if (canLowerSecurity()) await doWeaken();
    else if (canGrow()) await doGrow();
    else await doHack();
  }

  async function doHack() {
    ns.print(
      [
        "hacking...",
        ns.formatNumber(ns.getServerMoneyAvailable(target)),
        ns.formatNumber(ns.getServerMaxMoney(target)),
      ].join(" "),
    );
    return doScript("scripts/dummy-hack.js", ns.getHackTime(target));
  }

  async function doGrow() {
    const {
      schedule: [[, growDelay], [, weakenDelay]],
      totalTime,
    } = getOptimalSchedule(
      [growTask, weakenTask],
      (task) => task.time(target),
      SLEEP,
    );

    ns.print(
      [
        "growing...",
        ns.formatNumber(ns.getServerMoneyAvailable(target)),
        ns.formatNumber(ns.getServerMaxMoney(target)),
        ns.tFormat(totalTime),
      ].join(" "),
    );

    let hosts = getRootAccessServers(ns);

    for (const host of hosts) {
      ns.scp([hackTask.script, growTask.script, weakenTask.script], host);

      const freeRam = getFreeRam(host);
      const fullOpRam = GROW_PER_WEAK * growTask.ram + weakenTask.ram;
      const ratio = freeRam / fullOpRam;
      const weakenThreads = Math.ceil(ratio);
      const freeRamAfterWeaken = freeRam - weakenThreads * weakenTask.ram;
      const growThreads = Math.floor(freeRamAfterWeaken / growTask.ram);

      if (growThreads > 0 && weakenThreads > 0) {
        execScript({
          host,
          target,
          script: growTask.script,
          delay: growDelay,
          threads: growThreads,
        });
        execScript({
          host,
          target,
          script: weakenTask.script,
          delay: weakenDelay,
          threads: weakenThreads,
        });
      }
    }

    await ns.asleep(totalTime + SLEEP);
  }

  async function doWeaken() {
    ns.print(
      [
        "weakening...",
        ns.formatNumber(ns.getServerSecurityLevel(target)),
        ns.formatNumber(ns.getServerMinSecurityLevel(target)),
      ].join(" "),
    );
    return doScript("scripts/dummy-weaken.js", ns.getWeakenTime(target));
  }

  function canLowerSecurity() {
    return (
      ns.getServerMinSecurityLevel(target) < ns.getServerSecurityLevel(target)
    );
  }

  function canGrow() {
    return (
      ns.getServerMoneyAvailable(target) <
      Math.min(10_000_000, ns.getServerMaxMoney(target))
    );
  }

  async function doScript(script: string, time: number) {
    let hosts = getRootAccessServers(ns);
    for (const host of hosts) {
      ns.scp(script, host);
      const threads = howManyThreadsCanRun(script, host);
      if (threads <= 0) continue;
      let pid = execScript({ script, host, target, threads });
      pids.push(pid);
    }
    await ns.asleep(time + SLEEP);
    pids = [];
  }

  function execScript({
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
    return ns.exec(script, host, { threads }, target, "--delay", delay);
  }

  function getFreeRam(host: string) {
    const total = ns.getServerMaxRam(host);
    const used = ns.getServerUsedRam(host);
    return total - used;
  }

  function howManyThreadsCanRun(script: string, host = ns.getHostname()) {
    const freeRam = getFreeRam(host);
    const ram = getScriptRam(script);
    return Math.floor(freeRam / ram);
  }
}
