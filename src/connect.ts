import { connectTo } from "./utils/connectTo.ts";

export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

export function main(ns: Bitburner.NS) {
  const [target] = ns.args as [string];

  connectTo(ns, target);
}
