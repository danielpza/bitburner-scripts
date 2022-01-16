import {
  formatFloat,
  formatMoney,
  formatPercent,
  formatTime,
  formatTable,
  scanAll
} from "./shared";
const FILES = {
  weaken: "weaken.js",
  grow: "grow.js",
  hack: "hack.js"
};
export const SCHEDULE_WAIT_TIME = 200;
let THREAD_RAM = null;
function setupGlobals(ns) {
  THREAD_RAM = Math.max(...["weaken", "grow", "hack"].map((s) => ns.getScriptRam(FILES[s])));
}
const WEAKEN_COST = 0.05;
const GROW_COST = 4e-3;
const HACK_COST = 2e-3;
const calcYFromT = (threads, a, b) => Math.floor(threads / (b / a + 1));
export const calcFunc = (threads, a, b) => {
  const y = calcYFromT(threads, a, b);
  const x = threads - y;
  if (x === 0 || y === 0) {
    if (threads >= 2)
      return [1, threads - 1];
    else
      return [0, 0];
  }
  return [x, y];
};
async function weakenTarget(ns, target, slots) {
  ns.print("weaken");
  for (const { host, threads } of slots) {
    runScript(ns, "weaken", host, threads, target);
  }
  await ns.asleep(ns.getWeakenTime(target));
}
async function growTarget(ns, target, slots) {
  ns.print("grow");
  const runtime = {
    grow: ns.getGrowTime(target),
    weaken: ns.getWeakenTime(target)
  };
  const unsortedTasks = slots.flatMap(({ host, threads }) => {
    const [wt, gt] = calcFunc(threads, WEAKEN_COST, GROW_COST);
    return [
      { host, threads: gt, script: "grow" },
      { host, threads: wt, script: "weaken" }
    ];
  }).filter((t) => t.threads > 0);
  const { tasks, maxTime } = schedule(unsortedTasks, ({ script }) => runtime[script]);
  for (const [{ host, threads, script }, delay] of tasks) {
    runScript(ns, script, host, threads, target, delay);
  }
  await ns.asleep(maxTime);
}
async function hackTarget(ns, target, slots) {
  ns.print("hack");
  const runtime = {
    grow: ns.getGrowTime(target),
    weaken: ns.getWeakenTime(target),
    hack: ns.getHackTime(target)
  };
  const unsortedTasks = slots.flatMap(({ host, threads }) => {
    const [wt, ht] = calcFunc(threads / 2, WEAKEN_COST, HACK_COST);
    const [_2, gt] = calcFunc(threads / 2, WEAKEN_COST, GROW_COST);
    return [
      { host, threads: ht, script: "hack" },
      { host, threads: wt, script: "weaken" },
      { host, threads: gt, script: "grow" },
      { host, threads: wt, script: "weaken" }
    ];
  }).filter((t) => t.threads > 0);
  const { tasks, maxTime } = schedule(unsortedTasks, ({ script }) => runtime[script]);
  for (const [{ host, threads, script }, delay] of tasks) {
    runScript(ns, script, host, threads, target, delay);
  }
  await ns.asleep(maxTime);
}
export async function main(ns) {
  setupGlobals(ns);
  ns.disableLog("ALL");
  ns.tail();
  const getRootServers = () => scanAll(ns).filter((host) => ns.hasRootAccess(host)).concat("home");
  ns.atExit(() => {
    getRootServers().forEach((host) => ns.killall(host));
  });
  while (true) {
    const servers = getBestServersToHack(ns);
    const server = servers[0];
    if (!server) {
      ns.print("No server to hack");
      await ns.asleep(5e3);
      continue;
    }
    const target = server.host;
    showInfo(ns, servers.slice(0, 5).reverse());
    const slots = getAvailableSlots(ns);
    for (const slot of slots) {
      if (slot.host === "home")
        continue;
      await ns.scp([FILES.weaken, FILES.hack, FILES.grow], ns.getHostname(), slot.host);
    }
    if (server.sec > server.minSec + 5)
      await weakenTarget(ns, target, slots);
    else if (server.money < server.maxMoney * 0.9)
      await growTarget(ns, target, slots);
    else
      await hackTarget(ns, target, slots);
    await ns.asleep(100);
  }
}
function getSlot(ns, host, spare = 0) {
  const max = ns.getServerMaxRam(host);
  const used = ns.getServerUsedRam(host);
  const left = Math.max(max - used - spare, 0);
  const threads = Math.floor(left / THREAD_RAM);
  if (threads <= 0)
    return null;
  return { host, threads };
}
function getAvailableSlots(ns) {
  return [
    ...scanAll(ns).filter((host) => ns.hasRootAccess(host)).map((host) => getSlot(ns, host)),
    getSlot(ns, "home", 8)
  ].filter((slot) => slot?.threads ?? 0 > 0);
}
function getBestServersToHack(ns) {
  const servers = scanAll(ns).filter((host) => ns.hasRootAccess(host)).map((host) => ({
    host,
    money: ns.getServerMoneyAvailable(host),
    maxMoney: ns.getServerMaxMoney(host),
    hackChance: ns.hackAnalyzeChance(host),
    weakenTime: ns.getWeakenTime(host),
    sec: ns.getServerSecurityLevel(host),
    minSec: ns.getServerMinSecurityLevel(host),
    growth: ns.getServerGrowth(host)
  }));
  const sorted = _.orderBy(_.filter(servers, (server) => server.maxMoney > 0), [
    (server) => server.weakenTime < 60 * 1e3 ? 0 : 1,
    (server) => server.weakenTime < 2 * 60 * 1e3 ? 0 : 1,
    (server) => server.weakenTime < 3 * 60 * 1e3 ? 0 : 1,
    (server) => server.hackChance > 0.8 ? 0 : 1,
    (server) => -(server.growth / server.weakenTime)
  ]);
  return sorted;
}
function showInfo(ns, servers) {
  ns.print("\n", formatTable([
    "host",
    {
      name: "money",
      value: (server) => `${formatMoney(server.money)}/${formatMoney(server.maxMoney)}`
    },
    {
      name: "sec",
      value: (server) => `${formatFloat(server.sec)}/${formatFloat(server.minSec)}`
    },
    { name: "hackChance", format: formatPercent },
    { name: "weakenTime", format: formatTime },
    { name: "growth", format: formatFloat }
  ], servers));
}
function runScript(ns, script, host, threads, target, delay = 0) {
  ns.exec(FILES[script], host, threads, target, "--delay", delay);
}
export function schedule(tasks, getTime) {
  let mapped = tasks.map((t) => [t, getTime(t)]);
  const biggest = _.maxBy(mapped, "1")?.[1] ?? 0;
  mapped = mapped.slice(0, Math.ceil(biggest / SCHEDULE_WAIT_TIME));
  const extra = mapped.length * SCHEDULE_WAIT_TIME;
  const maxTime = (_.maxBy(mapped, "1")?.[1] ?? 0) + extra;
  const total = mapped.length;
  const withTime = mapped.map(([t, time], i) => [
    t,
    maxTime - (total - i) * SCHEDULE_WAIT_TIME - time
  ]);
  const min = _.minBy(withTime, "1")?.[1] ?? 0;
  const adjusted = withTime.map(([t, time]) => [t, time - min]);
  return { tasks: adjusted, maxTime: maxTime - min - SCHEDULE_WAIT_TIME };
}
