import { scanAll } from "../utils/scanAll.ts";
import { stackTail } from "../utils/stackTail.ts";
import { caesarCipherContract } from "./encryption-i-caesar-cipher.ts";

import { encryptionIIContract } from "./encryption-ii-vigenere-cipher.ts";
import { largestPrimeFactor } from "./find-largest-prime-factor.ts";
import { generateIpAddresses } from "./ip-address.ts";
import { proper2ColoringOfAGraphContrect } from "./proper-2-coloring-of-a-graph.ts";
import { totalWaysToSum } from "./total-ways-of-sum.ts";
import { triangleSumContract } from "./triangle-sum.ts";
import { uniquePathsIContract } from "./unique-paths-in-a-grid-i.ts";

const contracts = {
  "Encryption I: Caesar Cipher": caesarCipherContract,
  "Encryption II: Vigenère Cipher": encryptionIIContract,
  "Find Largest Prime Factor": largestPrimeFactor,
  "Generate IP Addresses": generateIpAddresses,
  "Total Ways to Sum II": totalWaysToSum,
  "Minimum Path Sum in a Triangle": triangleSumContract,
  "Unique Paths in a Grid I": uniquePathsIContract,
  "Proper 2-Coloring of a Graph": proper2ColoringOfAGraphContrect,
} as const;

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
  const output = solution(
    // @ts-expect-error
    input,
  );

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

  let blacklist = new Set<string>();

  do {
    for (const [server, file] of getContracts(ns)) {
      const type = ns.codingcontract.getContractType(file, server);
      if (blacklist.has(type)) continue;
      if (trySolve(ns, server, file)) {
        ns.toast(`Solved contract ${type} in ${server}`);
      } else {
        blacklist.add(type);
        ns.print(server, " ", file);
        ns.toast(`Failed to solve contract ${type} in ${server}`, "warning", null);
      }
    }
  } while (loop && (await ns.asleep(1_000 * 60)));
}
