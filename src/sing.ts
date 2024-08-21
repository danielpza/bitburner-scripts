import { nukeAll } from "./nuke-all.ts";
import { connectTo } from "./utils/connectTo.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  while (true) {
    purchasePrograms();
    nukeAll(ns);
    await backdoorAll();
    upgradeHome(ns);
    acceptInvites(ns);

    getBusy(ns);

    await ns.asleep(1000);
  }

  function purchasePrograms() {
    if (ns.singularity.purchaseTor()) {
      for (const program of ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]) {
        ns.singularity.purchaseProgram(program);
      }
    }
  }

  async function backdoorAll() {
    const factionServers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"];

    for (const server of factionServers) {
      await backdoorServer(ns, server);
    }
  }
}

function upgradeHome(ns: Bitburner.NS) {
  if (ns.singularity.upgradeHomeRam()) ns.print("Upgrade home ram");
  if (ns.singularity.upgradeHomeCores()) ns.print("Upgrade home cores");
}

function acceptInvites(ns: Bitburner.NS) {
  const invitations = ns.singularity.checkFactionInvitations();
  for (const invitation of invitations) {
    ns.singularity.joinFaction(invitation);
  }
}

async function backdoorServer(ns: Bitburner.NS, target: string) {
  const server = ns.getServer(target);

  if (server.backdoorInstalled) return false;
  if (!server.hasAdminRights) return false;
  if ((server.requiredHackingSkill ?? 0) > ns.getHackingLevel()) return false;

  connectTo(ns, target);

  await ns.singularity
    .installBackdoor()
    .then(() => {
      ns.print(`Backdoor installed on ${target}`);
    })
    .catch(() => {});
}

function getBusy(ns: Bitburner.NS) {
  if (ns.singularity.isBusy()) return;

  const player = ns.getPlayer();
  const factions = player.factions;
  // player.mults.

  for (const faction of factions) {
    const augmentations = ns.singularity
      .getAugmentationsFromFaction(faction)
      .filter((aug) => ns.singularity.getUpgradeHomeRamCost());
    for (const augmentation of augmentations) {
      ns.singularity.joinFaction(faction);
    }
  }

  // getAugmentationsFromFaction
  // ns.singularity.joinFaction(faction);

  // ns.singularity;
}
