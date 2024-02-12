import { table } from "./utils/table";

export function autocomplete() {
  return ["buy", "upgrade", "list", "watch"];
}

export async function main(ns: Bitburner.NS) {
  const [operation] = ns.args;

  // ns.resizeTail(200, 0);

  if (operation === "watch") {
    await watch();
    return;
  }

  if (operation === "buy") buy();
  else if (operation === "upgrade") upgrade();

  list();

  function buy() {
    let ram = getBiggestRam();
    if (!ram) {
      // ns.tprint("Cannot buy any servers");
      return;
    }
    if (
      ns.getPurchasedServerCost(ram) <= ns.getPlayer().money &&
      ns.getPurchasedServers().length < ns.getPurchasedServerLimit()
    ) {
      ns.print(`Buying server with ${ns.formatRam(ram)} ram`);
      ns.purchaseServer(getName(), ram);
    }
    // ns.setTitle(`${ns.getPurchasedServers().length}`);
  }

  function upgrade() {
    const servers = ns.getPurchasedServers();
    for (;;) {
      const smallestServer = _.minBy(servers, ns.getServerMaxRam);

      if (!smallestServer) break;

      const desiredRam = ns.getServerMaxRam(smallestServer) * 2;

      if (
        ns.getPurchasedServerUpgradeCost(smallestServer, desiredRam) >
        ns.getPlayer().money
      ) {
        // ns.setTitle(`${ns.formatRam(ns.getServerMaxRam(smallestServer))}`);
        break;
      }
      ns.print(`Upgrading ${smallestServer} to ${ns.formatRam(desiredRam)}`);
      ns.upgradePurchasedServer(smallestServer, desiredRam);
    }
    return;
  }

  function list() {
    const servers = ns.getPurchasedServers();
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

  async function watch() {
    ns.disableLog("ALL");
    // ns.enableLog("upgradePurchasedServer");
    // ns.enableLog("purchaseServer");
    for (;;) {
      upgrade();
      buy();
      await ns.sleep(1000);
    }
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
