import { execCommand } from "./utils/execCommand.ts";

export async function buyPrograms(ns: Bitburner.NS) {
  const files = [
    { file: "BruteSSH.exe", cost: 500_000 },
    { file: "FTPCrack.exe", cost: 1_500_000 },
    { file: "relaySMTP.exe", cost: 5_000_000 },
    { file: "HTTPWorm.exe", cost: 30_000_000 },
  ];
  for (const { file, cost } of files) {
    if (!ns.fileExists(file) && cost < ns.getPlayer().money) {
      ns.tprint(`Buying ${file}`);
      execCommand(`buy ${file}`);
      await ns.asleep(1000);
    }
  }
}
