import { scanAll } from "./utils/scanAll.ts";
import { formatTable } from "./utils/formatTable.ts";
import { HACK_SKILL_THRESHOLD, Jobs, TARGET_HACK_PERCENT } from "./utils/constants.ts";
import { hgwAnalyze } from "./utils/hgwAnalyze.ts";
import { Colors } from "./utils/constants.ts";

export async function main(ns: Bitburner.NS) {
  const RAM = ns.getScriptRam(Jobs.Weaken.script);

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(1200, 400);

  let servers = getServers();

  updateServersThread();

  while (true) {
    ns.clearLog();
    let { freeThreads, totalThreads } = getLoad();
    ns.print(
      `Servers: ${servers.length} | Using: ${totalThreads - freeThreads}/${totalThreads} (${formatPercent((totalThreads - freeThreads) / totalThreads)})`,
    );
    ns.print("-".repeat(40));
    ns.print(
      formatTable(
        _.chain(servers)
          .filter((server) => ns.getServerMaxMoney(server) > 0)
          .map((server) => {
            const playerHackLevel = ns.getHackingLevel();
            const weakenTime = ns.getWeakenTime(server);
            const hackLevel = ns.getServerRequiredHackingLevel(server);

            const currentMoney = ns.getServerMoneyAvailable(server);
            const maxMoney = ns.getServerMaxMoney(server);

            const hgwThreads = hgwAnalyze(ns, server, TARGET_HACK_PERCENT).totalThreads;
            const hasSkill = hackLevel < playerHackLevel / HACK_SKILL_THRESHOLD;

            const curSecurity = ns.getServerSecurityLevel(server);
            const minSecurity = ns.getServerMinSecurityLevel(server);
            const securityToLower = curSecurity - minSecurity;

            const moneyPerTime = (maxMoney * TARGET_HACK_PERCENT) / weakenTime;
            const moneyPerThread = (maxMoney * TARGET_HACK_PERCENT) / hgwThreads;

            return {
              server,

              weakenTime,

              hackLevel,
              hasSkill,

              hgwThreads,

              moneyPerTime,
              moneyPerThread,

              moneyPercent: currentMoney / maxMoney,

              security: securityToLower,
            };
          })
          .filter((server) => server.hasSkill)
          .orderBy(["hasSkill", "moneyPerThread"], ["desc", "desc"])
          .value(),
        [
          { header: "server", align: "left" },
          { header: "weakenTime", label: "wknTime", format: formatTime },
          // { header: "hackLevel", label: "Lvl" },
          // { header: "hasSkill", format: formatBoolean },
          // { header: "hgwThreads", label: "hgwThr", format: formatThread },
          // { header: "moneyPerTime", label: "mny/s", format: formatMoney },
          { header: "moneyPerThread", label: "mny/Thr", format: formatMoney },
          {
            header: "security",
            label: "sec",
            format: (n) => ns.formatNumber(n, 2),
            afterFormat: (str, v) => (v > 0 ? yellow(str) : str),
          },
          { header: "moneyPercent", label: "mny%", format: formatPercent },
        ],
      ),
    );
    await ns.asleep(200);
  }

  function getLoad() {
    let freeThreads = 0;
    let totalThreads = 0;
    for (const server of servers) {
      totalThreads += Math.floor(ns.getServerMaxRam(server) / RAM);
      freeThreads += Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / RAM);
    }
    return { freeThreads, totalThreads };
  }

  function getServers() {
    return scanAll(ns).filter((server) => ns.hasRootAccess(server));
  }

  async function updateServersThread() {
    while (true) {
      servers = getServers();
      await ns.asleep(5000);
    }
  }

  // formatters
  function formatMoney(value: number) {
    return "$" + ns.formatNumber(value);
  }
  function formatThread(value: number) {
    return ns.formatNumber(value, 0);
  }
  function formatTime(value: number) {
    return Math.floor(value / 1000) + "s";
  }
  function formatBoolean(value: boolean) {
    return value ? "yes" : "no";
  }
  function formatPercent(value: number) {
    return (value * 100).toFixed(2) + "%";
  }
}

const wrap = (color: string) => (value: string) => color + value + Colors.default;
const red = wrap(Colors.red);
const green = wrap(Colors.green);
const yellow = wrap(Colors.yellow);
