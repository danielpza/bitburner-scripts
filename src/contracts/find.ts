import { scanAll } from "../utils/scanAll.ts";
import { stackTail } from "../utils/stackTail.ts";

import { encryptionIIContract } from "./encryption-ii-vigenere-cipher.ts";
import { largestPrimeFactor } from "./find-largest-prime-factor.ts";

const contracts = {
  "Find Largest Prime Factor": largestPrimeFactor,
  "Encryption II: Vigenère Cipher": encryptionIIContract,
};

function getContracts(ns: Bitburner.NS) {
  const servers = scanAll(ns);
  return servers.flatMap((server) => ns.ls(server, ".cct").map((file) => [server, file]));
}

function trySolve(ns: Bitburner.NS, server: string, file: string) {
  const type = ns.codingcontract.getContractType(file, server);
  const solution = contracts[type as keyof typeof contracts];
  if (!solution) {
    return false;
  }
  const input = ns.codingcontract.getData(file, server);
  const output = solution(input);

  const result = ns.codingcontract.attempt(output, file, server);

  if (!result) {
    ns.tprint(`Failed to solve ${type} in ${server}`);
    throw new Error(`Failed to solve ${type} in ${server}`);
  }

  ns.print(`Solved ${type} in ${server} with input ${input} and output ${output}: ${result}`);
  return true;
}

export async function main(ns: Bitburner.NS) {
  const loop = ns.args.includes("--loop");

  if (loop) {
    ns.disableLog("ALL");
    stackTail(ns, 4);
  }

  const excludeSolutions = new Set<string>();

  do {
    for (const [server, file] of getContracts(ns)) {
      if (!trySolve(ns, server, file)) {
        const type = ns.codingcontract.getContractType(file, server);
        excludeSolutions.add(type);
        ns.toast(`Failed to solve contract ${type} in ${server}`);
      }
    }
  } while (loop && (await ns.asleep(1000)));
}
