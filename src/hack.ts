import { growTarget } from "./grow.ts";
import { binarySearch } from "./utils/binarySearch.ts";
import {
  ClusterExecOptions,
  clusterExec as clusterExec2,
} from "./utils/clusterExec.ts";
import {
  GROW_ANALYZE_SEC,
  GROW_PER_WEAK,
  HACK_ANALYZE_SEC,
  HACK_PER_WEAK,
  SLEEP,
  WEAK_ANALYZE,
} from "./utils/constants.ts";
import { getFreeThreads } from "./utils/getFreeThreads.ts";
import { scanAll } from "./utils/scanAll.ts";
import { getOptimalSchedule } from "./utils/schedule.ts";
import { weakenTarget } from "./weaken.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const MAX_CYCLES = 1000;

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  const includeHome = ns.args.includes("--home");

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

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
    await weakenTarget(ns, target);
    await growTarget(ns, target);
    await hackTarget();
    await ns.sleep(1500);
  }

  async function hackTarget() {
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

    for (
      i = 0;
      i < MAX_CYCLES && requiredThreads <= getAvailableThreads();
      i++
    ) {
      for (const [{ script, threads }, delay] of schedule) {
        clusterExec(ns, {
          script,
          target,
          threads,
          delay: delay + i * SLEEP,
        });
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

    await ns.asleep(totalTime + SLEEP * i + 1000);
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
    clusterExec2(ns, hosts, options);
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
