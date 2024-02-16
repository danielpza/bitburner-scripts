import { scanAll } from "../utils/scanAll.ts";

import { encryptionIIContract } from "./encryption-ii-vigenere-cipher.ts";
import { largestPrimeFactor } from "./find-largest-prime-factor.ts";

const contracts = {
  "Find Largest Prime Factor": largestPrimeFactor,
  "Encryption II: Vigenère Cipher": encryptionIIContract,
};

export function main(ns: Bitburner.NS) {
  const servers = scanAll(ns);

  // ns.tprint(ns.codingcontract.getContractTypes());

  for (const server of servers) {
    let files = ns.ls(server, ".cct");

    for (const file of files) {
      const type = ns.codingcontract.getContractType(file, server);
      const solution = contracts[type as keyof typeof contracts];
      if (!solution) {
        ns.tprint(`No solution for ${type} in ${server}`);
        continue;
      }
      const input = ns.codingcontract.getData(file, server);
      const output = solution(input);

      ns.tprint(
        `Solving ${type} in ${server} with input ${input} and output ${output}: ${ns.codingcontract.attempt(output, file, server)}`,
      );
    }
  }
}
