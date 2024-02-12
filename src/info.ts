import { table } from "./utils/table";
import { scanAll } from "./utils/scanAll";

export async function main(ns: Bitburner.NS) {
  const { loop } = ns.flags([["loop", false]]) as { loop: boolean };

  ns.print(ns.args);

  ns.disableLog("ALL");

  function getInfo() {
    const servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));

    return table(
      _.orderBy(servers, [
        (server) => ns.getServerRequiredHackingLevel(server),
      ]),
      [
        {
          header: "Name",
          getValue: (host) => host,
          align: "left",
        },
        {
          header: "Money",
          getValue: (host) => ns.getServerMoneyAvailable(host),
          format: ns.formatNumber,
        },
        {
          header: "Max Money",
          getValue: (host) => ns.getServerMaxMoney(host),
          format: ns.formatNumber,
        },
        {
          header: "Security",
          getValue: (host) => ns.getServerSecurityLevel(host),
          format: ns.formatNumber,
        },
        {
          header: "Min Sec",
          getValue: (host) => ns.getServerMinSecurityLevel(host),
          format: ns.formatNumber,
        },
        {
          header: "Skill",
          getValue: (host) => ns.getServerRequiredHackingLevel(host),
        },
        {
          header: "RAM",
          getValue: (host) => ns.getServerMaxRam(host),
        },
        {
          header: "growth",
          getValue: (host) => ns.getServerGrowth(host),
        },
      ],
    );
  }

  if (!loop) {
    ns.tprint("\n", getInfo());
    return;
  }
  ns.isRunning(script);

  ns.tail();
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
