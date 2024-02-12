import { table } from "./utils/table";

export function autocomplete() {
  return ["buy", "upgrade", "list"];
}

export async function main(ns: Bitburner.NS) {
  const [operation] = ns.args;

  const servers = ns.getPurchasedServers();

  if (operation === "buy") buy();
  else if (operation === "upgrade") upgrade();

  list();

  function buy() {
    let ram = getBiggestRam();
    if (!ram) {
      ns.tprint("Cannot buy any servers");
      return;
    }
    ns.purchaseServer(getName(), ram);
  }

  function upgrade() {
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

  function list() {
    ns.tprint(
      "\n",
      table(
        servers.map((host) => ({
          name: host,
          used: ns.getServerUsedRam(host),
          total: ns.getServerMaxRam(host),
          upgrade_cost: ns.getPurchasedServerUpgradeCost(
            host,
            ns.getServerMaxRam(host) * 2,
          ),
        })),
        [
          { header: "name", align: "left" },
          { header: "used", format: ns.formatRam },
          { header: "total", format: ns.formatRam },
          { header: "upgrade_cost", format: moneyFormat },
        ],
      ),
    );
  }

  function moneyFormat(value: number) {
    return `$${ns.formatNumber(value, 0)}`;
  }

  function getBiggestRam() {
    let ram: number;
    for (
      ram = 1;
      ns.getPurchasedServerCost(ram) <= ns.getPlayer().money;
      ram *= 2
    ) {}
    if (ram === 1) return 0;
    ram /= 2;
    return ram;
  }

  function getName() {
    return `purchased_server_${ns.getPurchasedServers().length + 1}`;
  }
}
