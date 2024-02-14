import { hackTarget } from "./hack.ts";
import { weakenGrowTarget } from "./weaken-grow.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  while (true) {
    await weakenGrowTarget(ns, target);
    await hackTarget(ns, target);
    await ns.sleep(1500);
  }
}
