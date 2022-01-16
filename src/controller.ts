import {
  formatFloat,
  formatMoney,
  formatPercent,
  formatTime,
  formatTable,
  scanAll,
} from "./shared";

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

function setupGlobals(ns: NS) {
  THREAD_RAM = Math.max(
    ...["weaken", "grow", "hack"].map((s) =>
      ns.getScriptRam(FILES[s as Script])
    )
  );
}

const WEAKEN_COST = 0.05;
const GROW_COST = 0.004;
const HACK_COST = 0.002;

/**
 * - `t = x + y`
 * - `ax = by`
 *
 * @returns `y`
 * @note value will be floored
 */
const calcYFromT = (threads: number, a: number, b: number) =>
  Math.floor(threads / (b / a + 1));

/**
 * - `t = x + y`
 * - `ax = by`
 *
 * @returns `[x, y]`
 * @note `y` will be floored, will return `[0, 0]` if `x` or `y` is 0
 */
export const calcFunc = (
  threads: number,
  a: number,
  b: number
): [number, number] => {
  const y = calcYFromT(threads, a, b);
  const x = threads - y;
  if (x === 0 || y === 0) {
    if (threads >= 2) return [1, threads - 1];
    else return [0, 0];
  }
  return [x, y];
};

type Task = {
  host: string;
  threads: number;
  script: Script;
};

interface Slot {
  host: string;
  threads: number;
}

async function weakenTarget(ns: NS, target: string, slots: Slot[]) {
  ns.print("weaken");

  for (const { host, threads } of slots) {
    runScript(ns, "weaken", host, threads, target);
  }

  await ns.asleep(ns.getWeakenTime(target));
}

async function growTarget(ns: NS, target: string, slots: Slot[]) {
  ns.print("grow");
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

  const { tasks, maxTime } = schedule(
    unsortedTasks,
    ({ script }) => runtime[script]
  );

  for (const [{ host, threads, script }, delay] of tasks) {
    runScript(ns, script, host, threads, target, delay);
  }

  await ns.asleep(maxTime);
}

async function hackTarget(ns: NS, target: string, slots: Slot[]) {
  ns.print("hack");
  const runtime = {
    grow: ns.getGrowTime(target),
    weaken: ns.getWeakenTime(target),
    hack: ns.getHackTime(target),
  };

  const unsortedTasks: Task[] = slots
    .flatMap(({ host, threads }) => {
      const [wt, ht] = calcFunc(threads / 2, WEAKEN_COST, HACK_COST);
      const [_, gt] = calcFunc(threads / 2, WEAKEN_COST, GROW_COST);

      return [
        { host, threads: ht, script: "hack" as const },
        { host, threads: wt, script: "weaken" as const },
        { host, threads: gt, script: "grow" as const },
        { host, threads: wt, script: "weaken" as const },
      ];
    })
    .filter((t) => t.threads > 0);

  const { tasks, maxTime } = schedule(
    unsortedTasks,
    ({ script }) => runtime[script]
  );

  for (const [{ host, threads, script }, delay] of tasks) {
    runScript(ns, script, host, threads, target, delay);
  }

  await ns.asleep(maxTime);
}

export async function main(ns: NS) {
  setupGlobals(ns);

  ns.disableLog("ALL");
  ns.tail();

  const getRootServers = () =>
    scanAll(ns)
      .filter((host) => ns.hasRootAccess(host))
      .concat("home");

  ns.atExit(() => {
    getRootServers().forEach((host) => ns.killall(host));
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const servers = getBestServersToHack(ns);
    const server = servers[0];

    if (!server) {
      ns.print("No server to hack");
      await ns.asleep(5000);
      continue;
    }

    const target = server.host;

    showInfo(ns, servers.slice(0, 5).reverse());

    const slots = getAvailableSlots(ns);
    // const rootServers = getRootServers();

    for (const slot of slots) {
      if (slot.host === "home") continue;
      await ns.scp(
        [FILES.weaken, FILES.hack, FILES.grow],
        ns.getHostname(),
        slot.host
      );
    }

    if (server.sec > server.minSec + 5) await weakenTarget(ns, target, slots);
    else if (server.money < server.maxMoney * 0.9)
      await growTarget(ns, target, slots);
    else await hackTarget(ns, target, slots);

    await ns.asleep(100); // always wait a bit just in case
  }
}

function getSlot(ns: NS, host: string, spare = 0): Slot | null {
  const max = ns.getServerMaxRam(host);
  const used = ns.getServerUsedRam(host);
  const left = Math.max(max - used - spare, 0);

  const threads = Math.floor(left / THREAD_RAM);

  if (threads <= 0) return null;
  return { host, threads };
}

function getAvailableSlots(ns: NS): Slot[] {
  return [
    ...scanAll(ns)
      .filter((host) => ns.hasRootAccess(host))
      .map((host) => getSlot(ns, host)),
    getSlot(ns, "home", 8),
  ].filter((slot) => slot?.threads ?? 0 > 0) as Slot[];
}

function getBestServersToHack(ns: NS) {
  const servers = scanAll(ns)
    .filter((host) => ns.hasRootAccess(host))
    .map((host) => ({
      host,
      money: ns.getServerMoneyAvailable(host),
      maxMoney: ns.getServerMaxMoney(host),
      hackChance: ns.hackAnalyzeChance(host),
      weakenTime: ns.getWeakenTime(host),
      sec: ns.getServerSecurityLevel(host),
      minSec: ns.getServerMinSecurityLevel(host),
      growth: ns.getServerGrowth(host),
    }));

  const sorted = _.orderBy(
    _.filter(servers, (server) => server.maxMoney > 0),
    [
      (server) => (server.weakenTime < 60 * 1000 ? 0 : 1),
      (server) => (server.weakenTime < 2 * 60 * 1000 ? 0 : 1),
      (server) => (server.weakenTime < 3 * 60 * 1000 ? 0 : 1),
      (server) => (server.hackChance > 0.8 ? 0 : 1),
      (server) => -(server.growth / server.weakenTime),
      // (server) => -(server.maxMoney / server.weakenTime),
    ]
  );

  return sorted;
}

function showInfo(ns: NS, servers: ReturnType<typeof getBestServersToHack>) {
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

function runScript(
  ns: NS,
  script: Script,
  host: string,
  threads: number,
  target: string,
  delay = 0
) {
  ns.exec(FILES[script], host, threads, target, "--delay", delay);
}

export function schedule<T>(
  tasks: T[],
  getTime: (task: T) => number
): { tasks: [T, number][]; maxTime: number } {
  let mapped: [T, number][] = tasks.map((t) => [t, getTime(t)]);
  const biggest = _.maxBy(mapped, "1")?.[1] ?? 0;

  mapped = mapped.slice(0, Math.ceil(biggest / SCHEDULE_WAIT_TIME));

  const extra = mapped.length * SCHEDULE_WAIT_TIME;

  const maxTime: number = (_.maxBy(mapped, "1")?.[1] ?? 0) + extra;

  const total = mapped.length;

  const withTime: [T, number][] = mapped.map(([t, time], i) => [
    t,
    maxTime - (total - i) * SCHEDULE_WAIT_TIME - time,
  ]);

  const min = _.minBy(withTime, "1")?.[1] ?? 0;
  const adjusted: [T, number][] = withTime.map(([t, time]) => [t, time - min]);

  return { tasks: adjusted, maxTime: maxTime - min - SCHEDULE_WAIT_TIME };
}
