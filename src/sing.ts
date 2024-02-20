import { trace } from "./utils/trace.ts";

import { nukeAll } from "./nuke-all.ts";

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");

  while (true) {
    purchasePrograms();
    nukeAll(ns);
    await backdoorAll();
    upgradeHome(ns);
    acceptInvites(ns);

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
  // if (ns.singularity.upgradeHomeRam()) ns.print("Upgrade home ram");
  // if (ns.singularity.upgradeHomeCores()) ns.print("Upgrade home cores");
}

function acceptInvites(ns: Bitburner.NS) {
  // TODO implement
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

function connectTo(ns: Bitburner.NS, target: string) {
  const path = trace(ns, target, ns.getHostname())?.slice(1);

  if (!path) {
    throw new Error(`Cannot reach ${target}`);
  }

  for (const server of path) {
    if (!ns.singularity.connect(server)) continue;
  }

  return true;
}
