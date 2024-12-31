import { trace } from "./utils/trace.ts";

export function autocomplete(autocompleteData: Bitburner.AutocompleteData) {
  return [...autocompleteData.servers, "--clip"];
}

export function main(ns: Bitburner.NS) {
  const target = ns.args[0] as string;

  if (ns.args.includes("--clip")) {
    ns.tprint(
      "\n" +
        trace(ns, target)
          ?.map((server) => `connect ${server}`)
          .join("; "),
    );
    return;
  }

  ns.tprint(trace(ns, target)?.join(" -> "));
}
