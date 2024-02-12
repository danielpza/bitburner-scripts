import { scanAll } from "./utils/scanAll";
import { formatTable } from "./utils/formatTable";

export async function main(ns: Bitburner.NS) {
  const sec = ns.args.includes("--sec");
  const ram = ns.args.includes("--ram");

  ns.disableLog("ALL");

  function getInfo() {
    const servers = scanAll(ns)
      .map((hostname) => {
        const server = ns.getServer(hostname);
        const timeRatio =
          server.minDifficulty && server.hackDifficulty
            ? server.minDifficulty / server.hackDifficulty
            : null;
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
          hack_time2: timeRatio ? ns.getHackTime(hostname) * timeRatio : null,
        };
      })
      .filter(
        (server) =>
          server.hasAdminRights &&
          !server.purchasedByPlayer &&
          (server.moneyAvailable ?? 0) > 0,
      );

    return formatTable(_.orderBy(servers, ["requiredHackingSkill"]), [
      { header: "name", align: "left" },
      // { header: "money", format: formatMoney },
      { header: "max_money", format: formatMoney },
      { header: "sec", format: ns.formatNumber, hide: !sec },
      { header: "min_sec", format: ns.formatNumber, hide: !sec },
      { header: "hack_skill", hide: !sec },
      { header: "ramUsed", format: ns.formatRam, hide: !ram },
      { header: "maxRam", format: ns.formatRam, hide: !ram },
      { header: "growth" },
      // { header: "organizationName", align: "left" },
      { header: "hack_time", format: ns.tFormat },
      { header: "hack_time2", format: ns.tFormat },
    ]);

    function formatMoney(value: number) {
      return "$" + ns.formatNumber(value);
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
