import { scanAll } from "../utils/scanAll.ts";

import { arrayJumpingGameII } from "./array-jumping-game-ii.ts";
import { arrayJumpingGame } from "./array-jumping-game.ts";
import { caesarCipherContract } from "./encryption-i-caesar-cipher.ts";
import { encryptionIIContract } from "./encryption-ii-vigenere-cipher.ts";
import { largestPrimeFactor } from "./find-largest-prime-factor.ts";
import { generateIpAddresses } from "./ip-address.ts";
import { mergeOverlappingIntervals } from "./merge-overlapping-intervals.ts";
import { proper2ColoringOfAGraphContrect } from "./proper-2-coloring-of-a-graph.ts";
import { algorithmicStockTraderI } from "./stock-trader-I.ts";
import { algorithmicStockTraderII } from "./stock-trader-II.ts";
import { algorithmicStockTraderIII } from "./stock-trader-III.ts";
import { algorithmicStockTraderIV } from "./stock-trader-IV.ts";
import { totalWaysToSumII } from "./total-ways-of-sum-ii.ts";
import { triangleSumContract } from "./triangle-sum.ts";
import { uniquePathsIContract } from "./unique-paths-in-a-grid-i.ts";
import { uniquePathsInAGridII } from "./unique-paths-in-a-grid-ii.ts";

const contracts = {
  "Algorithmic Stock Trader I": algorithmicStockTraderI,
  "Algorithmic Stock Trader II": algorithmicStockTraderII,
  "Algorithmic Stock Trader III": algorithmicStockTraderIII,
  "Algorithmic Stock Trader IV": algorithmicStockTraderIV,
  "Array Jumping Game II": arrayJumpingGameII,
  "Array Jumping Game": arrayJumpingGame,
  "Encryption I: Caesar Cipher": caesarCipherContract,
  "Encryption II: Vigenère Cipher": encryptionIIContract,
  "Find Largest Prime Factor": largestPrimeFactor,
  "Generate IP Addresses": generateIpAddresses,
  "Merge Overlapping Intervals": mergeOverlappingIntervals,
  "Minimum Path Sum in a Triangle": triangleSumContract,
  "Proper 2-Coloring of a Graph": proper2ColoringOfAGraphContrect,
  "Total Ways to Sum II": totalWaysToSumII,
  "Unique Paths in a Grid I": uniquePathsIContract,
  "Unique Paths in a Grid II": uniquePathsInAGridII,
} as const;

function getContracts(ns: Bitburner.NS) {
  const servers = scanAll(ns);
  return servers.flatMap((server) => ns.ls(server, ".cct").map((file) => [server, file]));
}

enum Result {
  Success,
  Failure,
  NoSolution,
}

function trySolve(ns: Bitburner.NS, server: string, file: string) {
  const type = ns.codingcontract.getContractType(file, server);
  const solution = contracts[type as keyof typeof contracts];
  if (!solution) {
    return Result.NoSolution;
  }
  const input = ns.codingcontract.getData(file, server);
  const output = solution(
    // @ts-expect-error
    input,
  );

  const result = ns.codingcontract.attempt(
    // @ts-expect-error
    output,
    file,
    server,
  );

  if (!result) {
    ns.print(`Failed to solve ${type} in ${server} with input ${input} and output ${output}`);
    return Result.Failure;
  }

  ns.print(`Solved ${type} in ${server} with input ${input} and output ${output}: ${result}`);
  return Result.Success;
}

export async function main(ns: Bitburner.NS) {
  const loop = ns.args.includes("--loop");

  if (loop) {
    ns.disableLog("ALL");
  }

  let blacklist = new Set<string>();

  do {
    for (const [server, file] of getContracts(ns)) {
      const type = ns.codingcontract.getContractType(file, server);
      if (blacklist.has(type)) continue;
      const result = trySolve(ns, server, file);
      if (result === Result.Success) ns.toast(`Solved contract ${type} in ${server}`, "success", 10_000);
      else {
        blacklist.add(type);
        if (result === Result.Failure) ns.toast(`Failed to solve contract ${type} in ${server}`, "error", null);
        if (result === Result.NoSolution) ns.toast(`No solution for contract ${type} in ${server}`, "warning", null);
      }
    }
  } while (loop && (await ns.asleep(1_000 * 60)));
}
