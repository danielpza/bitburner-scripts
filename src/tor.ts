import { execCommand } from "./utils/execCommand.ts";
import { stackTail } from "./utils/stackTail.ts";

const FILES = [
  { file: "BruteSSH.exe", cost: 500_000 },
  { file: "FTPCrack.exe", cost: 1_500_000 },
  { file: "relaySMTP.exe", cost: 5_000_000 },
  { file: "HTTPWorm.exe", cost: 30_000_000 },
];

export async function main(ns: Bitburner.NS) {
  const loop = ns.args.includes("--loop");

  stackTail(ns, 2);

  do {
    await buyPrograms(ns);
  } while (loop && (await ns.asleep(1000)));
}

export async function buyPrograms(ns: Bitburner.NS) {
  for (const { file, cost } of FILES) {
    if (!ns.fileExists(file) && cost < ns.getPlayer().money) {
      ns.print(`Buying ${file}`);
      execCommand(`buy ${file}`);
      await ns.asleep(1000);
    }
  }
}
