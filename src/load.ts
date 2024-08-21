import { scanAll } from "./utils/scanAll.ts";

export async function main(ns: Bitburner.NS) {
  const servers = scanAll(ns);
  let usedRam = 0;
  let totalRam = 0;

  for (const server of servers) {
    const maxRam = ns.getServerMaxRam(server);
    const used = ns.getServerUsedRam(server);
    usedRam += used;
    totalRam += maxRam;
  }

  ns.tprint(
    `${ns.formatRam(usedRam, 0)}/${ns.formatRam(totalRam, 0)} = ${ns.formatNumber(usedRam / totalRam)}%`,
  );
}
