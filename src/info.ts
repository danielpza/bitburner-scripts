import { scanAll } from "./utils/scanAll.ts";
import { formatTable } from "./utils/formatTable.ts";

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

  ns.disableLog("ALL");

  function getInfo() {
    const servers = scanAll(ns)
      .map((hostname) => {
        const server = ns.getServer(hostname);
        const timeRatio =
          server.minDifficulty && server.hackDifficulty
            ? server.minDifficulty / server.hackDifficulty
            : 0;

        const hack_threads = Math.ceil(1 / ns.hackAnalyze(hostname));
        const grow_threads = Math.ceil(
          ns.growthAnalyze(hostname, (server.moneyMax || 1) / 0.0000000001),
        );
        const weak_threads = Math.ceil(
          hack_threads / HACK_PER_WEAK + grow_threads / GROW_PER_WEAK,
        );
        return {
          name: server.hostname,
          money: server.moneyAvailable,
          max_money: server.moneyMax,
          sec: server.hackDifficulty,
          min_sec: server.minDifficulty,
          hack_skill: server.requiredHackingSkill,
          growth: server.serverGrowth,
          ...server,
          hack_time: ns.getHackTime(hostname),
          grow_time: ns.getGrowTime(hostname),
          weak_time: ns.getWeakenTime(hostname),
          hack_time2: ns.getHackTime(hostname) * timeRatio,
          grow_time2: ns.getGrowTime(hostname) * timeRatio,
          weak_time2: ns.getWeakenTime(hostname) * timeRatio,
          money_per_second:
            ((server.moneyMax ?? 0) /
              (ns.getWeakenTime(hostname) * timeRatio)) *
            1000,
          money_per_second_per_thread:
            server.moneyMax && server.moneyMax > 100
              ? ((server.moneyMax / (ns.getWeakenTime(hostname) * timeRatio)) *
                  1000) /
                ns.growthAnalyze(hostname, server.moneyMax / 100)
              : 0,
          hack_threads,
          grow_threads,
          weak_threads,
          money_per_thread:
            (server.moneyMax ?? 0) /
            (hack_threads + grow_threads + weak_threads),
        };
      })
      .filter(
        (server) =>
          server.hasAdminRights &&
          !server.purchasedByPlayer &&
          (server.moneyMax ?? 0) > 0,
      );

    return formatTable(
      _.chain(servers)
        .sortBy(
          (server) => (server.weak_time < 1000 * 60 * 10 ? 1 : 0),
          "money_per_thread",
        )
        .value(),
      [
        { header: "name", align: "left" },
        { header: "money", format: formatMoney },
        { header: "max_money", format: formatMoney },
        { header: "sec", format: ns.formatNumber, hide: !sec },
        { header: "min_sec", format: ns.formatNumber, hide: !sec },
        { header: "hack_skill", hide: !sec },
        { header: "ramUsed", format: ns.formatRam, hide: !ram },
        { header: "maxRam", format: ns.formatRam, hide: !ram },
        { header: "growth" },
        { header: "organizationName", align: "left" },
        { header: "hack_time", format: formatTime, hide: !time },
        { header: "grow_time", format: formatTime, hide: !time },
        { header: "weak_time", format: formatTime, hide: !time },
        // { header: "hack_time2", format: ns.tFormat, hide: !extra },
        // { header: "grow_time2", format: ns.tFormat, hide: !extra },
        // { header: "weak_time2", format: ns.tFormat, hide: !extra },
        // { header: "money_per_second", format: formatMoney, hide: !extra },
        // {
        //   header: "money_per_second_per_thread",
        //   format: formatMoney,
        //   hide: !extra,
        // },
        { header: "hack_threads", format: formatThread, hide: !threads },
        { header: "grow_threads", format: formatThread, hide: !threads },
        { header: "weak_threads", format: formatThread, hide: !threads },
        { header: "money_per_thread", format: formatMoney },
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
  }

  const isTail = !!ns.getRunningScript()?.tailProperties;

  if (!isTail) {
    ns.tprint("\n", getInfo());
    return;
  }

  ns.resizeTail(800, 400);

  for (;;) {
    ns.print(
      "\n",
      "-------------------------------------------",
      "\n",
      getInfo(),
    );
    await ns.sleep(1000);
  }
}
