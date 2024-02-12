export async function main(ns: Bitburner.NS) {
  const isTail = !!ns.getRunningScript()?.tailProperties;

  if (isTail) {
    for (;;) {
      doBuy();
      doUpgrade();
      await ns.asleep(5000);
    }
  } else {
    doBuy();
    doUpgrade();
  }

  function doBuy() {
    while (canBuyNode()) ns.hacknet.purchaseNode();
  }

  function doUpgrade() {
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      while (canUpgradeNodeLevel(i)) ns.hacknet.upgradeLevel(i);
      while (canUpgradeCoreLevel(i)) ns.hacknet.upgradeCore(i);
      while (canUpgradeRam(i)) ns.hacknet.upgradeRam(i);
    }
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
