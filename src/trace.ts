import { trace } from "./utils/trace.ts";

export function autocomplete(autocompleteData: Bitburner.AutocompleteData) {
  return autocompleteData.servers;
}

export function main(ns: Bitburner.NS) {
  const target = ns.args[0] as string;

  ns.tprint(trace(ns, target)?.join(" -> "));
}
