import { table } from "./utils/table";
import { scanAll } from "./utils/scanAll";

export function main(ns: Bitburner.NS) {
  const servers = scanAll(ns).filter((server) => ns.hasRootAccess(server));
  const out = table(
    _.orderBy(servers, [(server) => ns.getServerRequiredHackingLevel(server)]),
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
    ],
  );
  ns.tprint("\n", out);
}
