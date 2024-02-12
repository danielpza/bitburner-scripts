import { table } from "./utils/table";

export async function main(ns: Bitburner.NS) {
  const [operation] = ns.args;

  const servers = ns.getPurchasedServers();

  if (operation === "upgrade") {
    for (;;) {
      const smallestServer = _.minBy(servers, ns.getServerMaxRam);

      if (!smallestServer) break;

      if (
        !ns.upgradePurchasedServer(
          smallestServer,
          ns.getServerMaxRam(smallestServer) * 2,
        )
      )
        break;
    }
    return;
  }

  ns.tprint(
    "\n",
    table(
      servers.map((host) => ({
        name: host,
        used: ns.getServerUsedRam(host),
        total: ns.getServerMaxRam(host),
      })),
      [
        { header: "name", align: "left" },
        { header: "used", format: ramFormat },
        { header: "total", format: ramFormat },
      ],
    ),
  );

  function ramFormat(value: number) {
    return ns.formatNumber(value, 0);
  }
}
