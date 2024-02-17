import { scanAll } from "./utils/scanAll.ts";
import { formatTable } from "./utils/formatTable.ts";
import { Jobs, TARGET_HACK_PERCENT } from "./utils/constants.ts";
import { getRequiredWeakenThreads } from "./weaken.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";

export function autocomplete() {
  return ["--sec", "--ram", "--extra", "--time", "--threads"];
}

const HACK_ANALYZE_SEC = 0.002; // ns.hackAnalyzeSecurity(1);
const GROW_ANALYZE_SEC = 0.004; // ns.growthAnalyzeSecurity(1);
const WEAK_ANALYZE = 0.05; // ns.weakenAnalyze(1);

const GROW_PER_WEAK = WEAK_ANALYZE / GROW_ANALYZE_SEC;
const HACK_PER_WEAK = WEAK_ANALYZE / HACK_ANALYZE_SEC;

export async function main(ns: Bitburner.NS) {
  const sec = ns.args.includes("--sec");
  const ram = ns.args.includes("--ram");
  // const extra = ns.args.includes("--extra");
  const time = ns.args.includes("--time");
  const threads = ns.args.includes("--threads");

  const TIME_GROUP = 1000 * 60 * 5;

  ns.disableLog("ALL");

  function getServers() {
    const servers = scanAll(ns).filter((server) => ns.getServerMaxMoney(server) > 0 && ns.hasRootAccess(server));
    const RAM = ns.getScriptRam(Jobs.Weaken.script);
    const maxThreads = servers.reduce((acc, server) => acc + Math.floor(ns.getServerMaxRam(server) / RAM), 0);
    const playerHackLevel = ns.getHackingLevel();

    return servers.map((server) => {
      const hackLevel = ns.getServerRequiredHackingLevel(server);
      const requiredWeaken = getRequiredWeakenThreads(ns, server);
      const weakenCycles = Math.ceil(requiredWeaken / maxThreads);
      const weakenTime = ns.getWeakenTime(server);

      const totalWeakenTime = weakenTime * weakenCycles;

      const maxMoney = ns.getServerMaxMoney(server);

      const hackThreads = Math.ceil(TARGET_HACK_PERCENT / ns.hackAnalyze(server));
      const growThreads = Math.ceil(ns.growthAnalyze(server, 1 / (1 - TARGET_HACK_PERCENT)));
      const weakThreads = Math.ceil(hackThreads / HACK_PER_WEAK + growThreads / GROW_PER_WEAK);

      const hgwThreads = hackThreads + growThreads + weakThreads;

      const hasSkill = hackLevel < playerHackLevel / 2.5;
      const moneyPerThread = maxMoney / hgwThreads;
      const weakenScore = -Math.floor((weakenTime * weakenCycles) / TIME_GROUP);
      const weakenTimeScore = -Math.floor(weakenTime / TIME_GROUP);

      return {
        name: server,
        hackLevel,
        requiredWeaken,
        weakenCycles,
        weakenTime,
        totalWeakenTime,
        maxMoney,
        hackThreads,
        growThreads,
        weakThreads,
        hgwThreads,
        hasSkill,
        moneyPerThread,
        weakenScore,
        weakenTimeScore,
      };
    });
  }

  function getInfo() {
    return formatTable(
      _.sortBy(
        getServers().filter((server) => server.hasSkill),
        ["hasSkill", "moneyPerThread"],
      ),
      [
        { header: "name", align: "left" },
        { header: "maxMoney", format: formatMoney },
        { header: "hackLevel" },
        { header: "requiredWeaken" },
        { header: "weakenCycles" },
        { header: "weakenTime", format: formatTime },
        { header: "totalWeakenTime", format: formatTime },
        { header: "hgwThreads", format: formatThread },
        { header: "hasSkill", format: formatBoolean },
        { header: "moneyPerThread", format: formatMoney },
        { header: "weakenScore" },
        { header: "weakenTimeScore" },
      ],
    );

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
  }

  const isTail = !!ns.getRunningScript()?.tailProperties;

  if (!isTail) {
    ns.tprint("\n", getInfo());
    return;
  }

  ns.resizeTail(800, 400);

  for (;;) {
    ns.print("\n", "-------------------------------------------", "\n", getInfo());
    await ns.sleep(1000);
  }
}
