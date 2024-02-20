import { scanAll } from "./utils/scanAll.ts";
import { formatTable } from "./utils/formatTable.ts";
import { HACK_SKILL_THRESHOLD, Jobs, TARGET_HACK_PERCENT } from "./utils/constants.ts";
import { getRequiredWeakenThreads } from "./weaken.ts";
import { getRequiredGrowThreads } from "./grow.ts";
import { hgwAnalyze } from "./utils/hgwAnalyze.ts";

export function autocomplete() {
  // return ["--sec", "--ram", "--extra", "--time", "--threads"];
  return [];
}

// const TIME_GROUP = 1000 * 60 * 5;

export async function main(ns: Bitburner.NS) {
  // const sec = ns.args.includes("--sec");
  // const ram = ns.args.includes("--ram");
  // const extra = ns.args.includes("--extra");
  // const time = ns.args.includes("--time");
  // const threads = ns.args.includes("--threads");

  const RAM = ns.getScriptRam(Jobs.Weaken.script);

  ns.disableLog("ALL");

  function getServers() {
    const servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
    const maxThreads = servers.reduce((acc, server) => acc + Math.floor(ns.getServerMaxRam(server) / RAM), 0);
    const playerHackLevel = ns.getHackingLevel();

    return servers
      .filter((server) => ns.getServerMaxMoney(server) > 0)
      .map((server) => getServerInfo(ns, server, { maxThreads, playerHackLevel }));
  }

  function getInfo() {
    return formatTable(
      _.sortBy(
        getServers().filter((server) => server.canHack),
        ["hasSkill", "initialWeakenScore", "moneyPerThreadScore", "moneyPerThread"],
      ),
      [
        { header: "name", align: "left" },
        { header: "maxMoney", label: "MxMny", format: formatMoney },
        { header: "hackLevel", label: "Lvl" },
        { header: "requiredWeaken", label: "wknThr" },
        { header: "weakenCycles", label: "wknCycles" },
        { header: "weakenTime", label: "wknTime", format: formatTime },
        // { header: "totalWeakenTime", label: "TWeakTime", format: formatTime },
        { header: "hgwThreads", label: "HGW", format: formatThread },
        { header: "hasSkill", format: formatBoolean },
        { header: "moneyPerThread", label: "mny/Thr", format: formatMoney },
        { header: "moneyPerTime", label: "mny/s", format: formatMoney },
        { header: "initialWeakenScore", label: "wkn*" },
        // { header: "weakenTimeScore" },
        { header: "moneyPerThreadScore", label: "mny/Thr*" },
        { header: "moneyPerTimeScore", label: "mny/s*" },
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

export function getServerInfo(
  ns: Bitburner.NS,
  server: string,
  { maxThreads, playerHackLevel }: { maxThreads: number; playerHackLevel: number },
) {
  const hackLevel = ns.getServerRequiredHackingLevel(server);

  const requiredWeaken = getRequiredWeakenThreads(ns, server);
  const weakenCycles = Math.ceil(requiredWeaken / maxThreads);
  const weakenTime = ns.getWeakenTime(server);
  const totalWeakenTime = weakenTime * weakenCycles;

  const requiredGrow = getRequiredGrowThreads(ns, server);
  const growCycles = Math.ceil(requiredGrow / maxThreads);
  const growTime = ns.getGrowTime(server);
  const totalGrowTime = growTime * growCycles;

  const maxMoney = ns.getServerMaxMoney(server);

  const {
    growThreads,
    hackThreads,
    weakenThreads: weakThreads,
    totalThreads: hgwThreads,
  } = hgwAnalyze(ns, server, TARGET_HACK_PERCENT);

  const canHack = hackLevel < playerHackLevel;
  const hasSkill = hackLevel < playerHackLevel / HACK_SKILL_THRESHOLD;
  const moneyPerThread = maxMoney / hgwThreads;
  const moneyPerTime = maxMoney / weakenTime;

  const initialWeakenTime = weakenTime * weakenCycles;

  const initialWeakenScore = -Math.floor(Math.log(initialWeakenTime));
  // const weakenTimeScore = -Math.floor(Math.log(weakenTime));
  const moneyPerThreadScore = Math.ceil(Math.log(moneyPerThread));
  const moneyPerTimeScore = Math.ceil(Math.log(moneyPerTime));

  return {
    name: server,
    hackLevel,

    requiredWeaken,
    weakenCycles,
    weakenTime,
    totalWeakenTime,

    requiredGrow,
    growCycles,
    growTime,
    totalGrowTime,

    maxMoney,
    hackThreads,
    growThreads,
    weakThreads,
    hgwThreads,
    canHack,
    hasSkill,
    moneyPerThread,
    moneyPerTime,

    initialWeakenScore,
    // weakenTimeScore,
    moneyPerThreadScore,
    moneyPerTimeScore,
  };
}
