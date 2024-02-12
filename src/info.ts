import { scanAll } from "./utils/scanAll";
import { formatTable } from "./utils/formatTable";

export async function main(ns: Bitburner.NS) {
  ns.print(ns.args);

  ns.disableLog("ALL");

  function getInfo() {
    const servers = scanAll(ns)
      .map((hostname) => ns.getServer(hostname))
      .filter(
        (server) =>
          server.hasAdminRights &&
          !server.purchasedByPlayer &&
          (server.moneyAvailable ?? 0) > 0,
      );

    servers[0].hostname;

    return formatTable(_.orderBy(servers, ["requiredHackingSkill"]), [
      { header: "hostname", align: "left" },
      { header: "moneyAvailable", format: formatMoney },
      { header: "moneyMax", format: formatMoney },
      { header: "hackDifficulty", format: ns.formatNumber },
      { header: "minDifficulty", format: ns.formatNumber },
      { header: "requiredHackingSkill" },
      // { header: "ramUsed", format: ns.formatRam },
      { header: "maxRam", format: ns.formatRam },
      { header: "serverGrowth" },
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
