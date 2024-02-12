export async function main(ns: Bitburner.NS) {
  for (;;) {
    while (canBuyNode()) ns.hacknet.purchaseNode();

    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      while (canUpgradeNodeLevel(i)) ns.hacknet.upgradeLevel(i);
      while (canUpgradeCoreLevel(i)) ns.hacknet.upgradeCore(i);
      while (canUpgradeRam(i)) ns.hacknet.upgradeRam(i);
    }

    await ns.asleep(5000);
  }

  function canUpgradeNodeLevel(i: number) {
    return ns.hacknet.getLevelUpgradeCost(i) <= ns.getPlayer().money;
  }

  function canUpgradeCoreLevel(i: number) {
    return ns.hacknet.getCoreUpgradeCost(i) <= ns.getPlayer().money;
  }

  function canUpgradeRam(i: number) {
    return ns.hacknet.getRamUpgradeCost(i) <= ns.getPlayer().money;
  }

  function canBuyNode() {
    return (
      ns.hacknet.numNodes() < ns.hacknet.maxNumNodes() &&
      ns.getPlayer().money >= ns.hacknet.getPurchaseNodeCost()
    );
  }
}
