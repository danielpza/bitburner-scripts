import {
  formatFloat,
  formatInteger,
  formatMoney,
  formatPercent,
  formatTable,
  formatTime,
  scanAll,
} from "./shared";
import { getSchedule, createLoop } from "./schedule";

type Script = "hack" | "weaken" | "grow";

const FILES: Record<Script, string> = {
  weaken: "weaken.js",
  grow: "grow.js",
  hack: "hack.js",
};

export const SCHEDULE_WAIT_TIME = 200;

/**
 * @example
 *   THREAD_RAM = getThreadCost(ns);
 *
 * @note needs to be updated from main
 */
let THREAD_RAM: number = null as never;

function setupGlobals(ns: Bitburner.NS) {
  THREAD_RAM = Math.max(
    ...["weaken", "grow", "hack"].map((s) =>
      ns.getScriptRam(FILES[s as Script])
    )
  );
}

const WEAKEN_COST = 0.05;
const GROW_COST = 0.004;
const HACK_COST = 0.002;

const getWeakenThreads = (opThreads: number, cost: number) =>
  Math.ceil((opThreads * cost) / WEAKEN_COST);

interface Slot {
  host: string;
  threads: number;
}

export async function main(ns: Bitburner.NS) {
  setupGlobals(ns);

  ns.disableLog("ALL");
  ns.tail();

  ns.atExit(() => {
    scanAll(ns)
      .filter((host) => ns.hasRootAccess(host))
      .concat(["home"])
      .forEach((host) => ns.killall(host));
  });

  let ignoredServers: { target: string; runningScripts: RunningScript[] }[] =
    [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const slots = getAvailableSlots(ns);

    let toRemove: { target: string; runningScripts: RunningScript[] }[] = [];

    [toRemove, ignoredServers] = _.partition(
      ignoredServers,
      (ignoredServer) => getMoneyPercent(ns, ignoredServer.target) < 0.8
    );

    for (const ignoredServer of toRemove) {
      for (const runningScript of ignoredServer.runningScripts) {
        ns.kill(
          runningScript.script,
          runningScript.host,
          ...runningScript.args
        );
      }
    }

    const servers = getBestServersToHack(
      ns,
      ignoredServers.map((s) => s.target),
      _.sumBy(slots, "threads")
    );
    const server = servers[0];

    ns.print(`Ignored: ${ignoredServers.map((s) => s.target).join(", ")}`);

    if (!server) {
      ns.print("No server to hack");
      await ns.asleep(5000);
      continue;
    }

    const target = server.host;

    showInfo(ns, servers.slice(0, 5).reverse());

    for (const slot of slots) {
      if (slot.host === "home") continue;
      await ns.scp(
        [FILES.weaken, FILES.hack, FILES.grow],
        ns.getHostname(),
        slot.host
      );
    }

    if (server.sec > server.minSec + 5)
      await ns.asleep(weakenTarget(ns, target, slots));
    else if (server.money < server.maxMoney * 0.9)
      await ns.asleep(growTarget(ns, target, slots));
    else {
      const scripts = hackTarget(ns, target, slots);

      if (scripts.length) {
        ignoredServers.push({ target, runningScripts: scripts });
        // TODO go to next server
      }

      await ns.asleep(1000);
    }

    await ns.asleep(200); // always wait a bit just in case
  }
}

const useThreads = (
  ns: Bitburner.NS,
  name: string,
  threadsNeeded: number,
  slots: Slot[],
  run: (host: string, threads: number) => void
) => {
  let threadsLeft = threadsNeeded;

  let slotsLeft: Slot[] = [];

  let i = 0;
  while (threadsLeft > 0 && i < slots.length) {
    const slot = slots[i];
    const threads = Math.min(threadsLeft, slot.threads);

    threadsLeft -= threads;
    run(slot.host, threads);

    if (threadsLeft < 0) {
      const slotThreadsLeft = slot.threads - threads;
      if (slotThreadsLeft > 0)
        slotsLeft.push({ host: slot.host, threads: slotThreadsLeft });
    }

    i++;
  }

  slotsLeft = slotsLeft.concat(slots.slice(i));

  ns.print(
    `${name}. threads=${formatInteger(threadsLeft)}/${formatInteger(
      threadsNeeded
    )}`
  );

  return slotsLeft;
};

function weakenTarget(ns: Bitburner.NS, target: string, slots: Slot[]) {
  const threadsNeeded =
    (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) /
    WEAKEN_COST;

  useThreads(ns, "weaken", threadsNeeded, slots, (host, threads) => {
    runScript(ns, "weaken", host, threads, target);
  });

  return ns.getWeakenTime(target);
}

function growTarget(ns: Bitburner.NS, target: string, slots: Slot[]) {
  const runtime = {
    grow: ns.getGrowTime(target),
    weaken: ns.getWeakenTime(target),
  };

  const unsortedTasks = slots
    .flatMap(({ host, threads }) => {
      const [wt, gt] = calcFunc(threads, WEAKEN_COST, GROW_COST);

      return [
        { host, threads: gt, script: "grow" as const },
        { host, threads: wt, script: "weaken" as const },
      ];
    })
    .filter((t) => t.threads > 0);

  const { schedule: tasks, totalTime: maxTime } = getSchedule(
    unsortedTasks,
    ({ script }) => runtime[script],
    SCHEDULE_WAIT_TIME
  );

  for (const [{ host, threads, script }, delay] of tasks) {
    runScript(ns, script, host, threads, target, delay);
  }

  return maxTime;
}

function hackTarget(ns: Bitburner.NS, target: string, slots: Slot[]) {
  ns.print("hack");
  const runtime = {
    grow: ns.getGrowTime(target),
    weaken: ns.getWeakenTime(target),
    hack: ns.getHackTime(target),
  };

  /** Desired amount of money to hack on each batch percent of total money available */
  const moneyToHackPercent = 0.1;

  const hackThreads = Math.floor(
    Math.max(moneyToHackPercent / ns.hackAnalyze(target), 1)
  );
  const hackWeakenThreads = getWeakenThreads(hackThreads, HACK_COST);
  const growThreads = Math.ceil(
    ns.growthAnalyze(target, 1 / (1 - moneyToHackPercent))
  );
  const growWeakenThreads = getWeakenThreads(growThreads, GROW_COST);

  type TaskGroup = {
    script: Script;
    taskTime: number;
    threads: number;
    tasks: Slot[][];
  };
  const tasksGroup: TaskGroup[] = [
    { threads: hackThreads, tasks: [], script: "hack", taskTime: runtime.hack },
    {
      threads: hackWeakenThreads,
      tasks: [],
      script: "weaken",
      taskTime: runtime.weaken,
    },
    { threads: growThreads, tasks: [], script: "grow", taskTime: runtime.grow },
    {
      threads: growWeakenThreads,
      tasks: [],
      script: "weaken",
      taskTime: runtime.weaken,
    },
  ];

  let left = slots;
  let taken: Slot[] = [];
  let success = true;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const taskGroup of tasksGroup) {
      ({ left, success, taken } = takeSlots(left, taskGroup.threads));
      if (!success) break;
      taskGroup.tasks.push(taken);
    }
    if (!success) break;
  }

  const batchesDescription = tasksGroup.map((taskGroup) => ({
    taskTime: taskGroup.taskTime,
    tasks: taskGroup.tasks.map((slots) => ({
      slots,
      script: taskGroup.script,
    })),
  }));

  const { tasksLoop, loopTime } = createLoop(
    batchesDescription,
    SCHEDULE_WAIT_TIME
  );

  const scripts: RunningScript[] = [];

  for (const [{ script, slots }, delay] of tasksLoop) {
    for (const slot of slots) {
      scripts.push(
        runScript(ns, script, slot.host, slot.threads, target, delay, loopTime)
      );
    }
  }
  return scripts;
}

function getSlot(ns: Bitburner.NS, host: string, spare = 0): Slot | null {
  const max = ns.getServerMaxRam(host);
  const used = ns.getServerUsedRam(host);
  const left = Math.max(max - used - spare, 0);

  const threads = Math.floor(left / THREAD_RAM);

  if (threads <= 0) return null;
  return { host, threads };
}

function getAvailableSlots(ns: Bitburner.NS): Slot[] {
  return [
    ...scanAll(ns)
      .filter((host) => ns.hasRootAccess(host))
      .map((host) => getSlot(ns, host)),
    getSlot(ns, "home", 30),
  ].filter((slot) => slot?.threads ?? 0 > 0) as Slot[];
}

function getBestServersToHack(
  ns: Bitburner.NS,
  ignoredServers: string[],
  totalThreads: number
) {
  const ignored = new Set(ignoredServers);
  const servers = scanAll(ns)
    .filter((host) => ns.hasRootAccess(host) && !ignored.has(host))
    .map((host) => ({
      host,
      money: ns.getServerMoneyAvailable(host),
      maxMoney: ns.getServerMaxMoney(host),
      hackChance: ns.hackAnalyzeChance(host),
      weakenTime: ns.getWeakenTime(host),
      sec: ns.getServerSecurityLevel(host),
      minSec: ns.getServerMinSecurityLevel(host),
      growth: ns.getServerGrowth(host),
      // hackAnalyze: ns.hackAnalyze(host),
    }));

  const timesToGrow = (server: (typeof servers)[number]) =>
    server.weakenTime *
    (totalThreads /
      ns.growthAnalyze(
        server.host,
        server.maxMoney / (server.money + 0.01) + 1
      ));
  const sorted = _.orderBy(
    _.filter(servers, (server) => server.maxMoney > 0),
    [
      (server) => (server.weakenTime < 60 * 1000 ? 0 : 1),
      (server) => (server.hackChance > 0.8 ? 0 : 1),
      (server) => server.maxMoney / timesToGrow(server),
      // (server) =>
      //   ((server.hackAnalyze + 1) / server.weakenTime) *
      //   server.hackChance *
      //   server.maxMoney,
      // (server) => -(server.maxMoney / server.weakenTime),
    ]
  );

  return sorted;
}

function showInfo(
  ns: Bitburner.NS,
  servers: ReturnType<typeof getBestServersToHack>
) {
  ns.print(
    "\n",
    formatTable(
      [
        "host",
        {
          name: "money",
          value: (server) =>
            `${formatMoney(server.money)}/${formatMoney(server.maxMoney)}`,
        },
        {
          name: "sec",
          value: (server) =>
            `${formatFloat(server.sec)}/${formatFloat(server.minSec)}`,
        },
        { name: "hackChance", format: formatPercent },
        { name: "weakenTime", format: formatTime },
        { name: "growth", format: formatFloat },
      ],
      servers
    )
  );
}

type RunningScript = { script: string; host: string; args: string[] };

function runScript(
  ns: Bitburner.NS,
  script: Script,
  host: string,
  threads: number,
  target: string,
  delay = 0,
  loop = 0
): RunningScript {
  const args = [target, "--delay", delay, "--loop", loop].filter(
    (v) => v != null
  ) as string[];

  ns.exec(FILES[script], host, threads, ...args);

  return { script: FILES[script], host, args };
}

/**
 * - `t = x + y`
 * - `ax = by`
 *
 * @returns `y`
 */
function calcYFromT(threads: number, a: number, b: number) {
  return threads / (b / a + 1);
}

/**
 * - `t = x + y`
 * - `ax = by`
 *
 * @returns `[x, y]`
 * @note `y` will be floored, will return `[0, 0]` if `x` or `y` is 0
 */
export function calcFunc(
  threads: number,
  a: number,
  b: number
): [number, number] {
  const y = Math.floor(calcYFromT(threads, a, b));
  const x = threads - y;
  if (x === 0 || y === 0) {
    if (threads >= 2) return [1, threads - 1];
    else return [0, 0];
  }
  return [x, y];
}

function takeSlots(
  slots: Slot[],
  threadsToTake: number
): { taken: Slot[]; left: Slot[]; success: boolean } {
  let takenSoFar = 0;
  const taken: Slot[] = [];
  let left: Slot[] = [];
  let success = true;

  let i = 0;
  while (threadsToTake > 0 && takenSoFar < threadsToTake) {
    if (i >= slots.length) {
      success = false;
      break;
    }

    const toTake = Math.min(threadsToTake - takenSoFar, slots[i].threads);
    if (toTake <= 0) {
      // TODO what to do with server?
      i++;
      continue;
    }
    takenSoFar += toTake;
    const leftInSlot = slots[i].threads - toTake;
    taken.push({ ...slots[i], threads: toTake });
    if (leftInSlot > 0) {
      left.push({ ...slots[i], threads: leftInSlot });
    }
    i++;
  }

  left = left.concat(slots.slice(i));

  return { taken, left, success };
}

function getMoneyPercent(ns: Bitburner.NS, target: string) {
  return ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target);
}
