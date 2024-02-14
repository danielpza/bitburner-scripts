import { growTarget } from "./grow.ts";
import { hackTarget } from "./hack.ts";
import { weakenTarget } from "./weaken.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.disableLog("ALL");

  ns.tail();
  ns.resizeTail(600, 120);

  while (true) {
    await weakenTarget(ns, target);
    await growTarget(ns, target);
    await hackTarget(ns, target);
    await ns.sleep(1500);
  }
}
