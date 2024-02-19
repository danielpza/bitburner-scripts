import { formatTable } from "./utils/formatTable.ts";

export function autocomplete() {
  return ["buy", "upgrade", "list", "loop"];
}

function getBufferMoney(_ns: Bitburner.NS) {
  return 0;
}

export async function main(ns: Bitburner.NS) {
  const [operation] = ns.args;

  ns.disableLog("ALL");

  if (operation === "buy") while (tryPurchaseServer(ns));
  else if (operation === "upgrade") while (tryUpgradeServer(ns));

  if (operation === "loop") {
    do {
      while (tryPurchaseServer(ns));
      while (tryUpgradeServer(ns));
    } while (await ns.asleep(1000));
  } else list(ns);
}

export function tryPurchaseServer(ns: Bitburner.NS) {
  let ram = getBiggestRam();
  if (!ram) {
    // ns.tprint("Cannot buy any servers");
    return false;
  }
  const canBuyServer =
    ns.getPurchasedServerCost(ram) <= ns.getPlayer().money - getBufferMoney(ns) &&
    ns.getPurchasedServers().length < ns.getPurchasedServerLimit();
  if (!canBuyServer) {
    return false;
  }

  ns.print(`Buying server with ${ns.formatRam(ram)} ram`);
  ns.purchaseServer(getName(), ram);

  return true;

  function getBiggestRam() {
    let ram: number;
    for (ram = 1; ns.getPurchasedServerCost(ram) <= ns.getPlayer().money - getBufferMoney(ns); ram *= 2) {}
    if (ram === 1) return 0;
    ram /= 2;
    return ram;
  }

  function getName() {
    return `purchased_server_${ns.getPurchasedServers().length + 1}`;
  }
}

export function tryUpgradeServer(ns: Bitburner.NS) {
  const server = getSmallestServer();
  if (!server) return false;

  const desiredRam = ns.getServerMaxRam(server) * 2;

  if (!canUpgradeServer(server, desiredRam)) return false;

  ns.print(`Upgrading ${server} to ${ns.formatRam(desiredRam)}`);

  return ns.upgradePurchasedServer(server, desiredRam);

  function canUpgradeServer(server: string, desiredRam: number) {
    return ns.getPurchasedServerUpgradeCost(server, desiredRam) <= ns.getPlayer().money - getBufferMoney(ns);
  }

  function getSmallestServer() {
    const servers = ns.getPurchasedServers();
    return _.minBy(servers, ns.getServerMaxRam);
  }
}

function list(ns: Bitburner.NS) {
  const servers = ns.getPurchasedServers();
  ns.tprint(
    "\n",
    formatTable(
      servers.map((host) => ({
        name: host,
        used: ns.getServerUsedRam(host),
        total: ns.getServerMaxRam(host),
        upgrade_cost: ns.getPurchasedServerUpgradeCost(host, ns.getServerMaxRam(host) * 2),
      })),
      [
        { header: "name", align: "left" },
        { header: "used", format: ns.formatRam },
        { header: "total", format: ns.formatRam },
        { header: "upgrade_cost", format: moneyFormat },
      ],
    ),
  );

  function moneyFormat(value: number) {
    return `$${ns.formatNumber(value, 0)}`;
  }
}
