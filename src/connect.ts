import { execCommand } from "./utils/execCommand.ts";
import { trace } from "./utils/trace.ts";

export function autocomplete(autocompleteData: Bitburner.AutocompleteData) {
  return autocompleteData.servers;
}

export async function main(ns: Bitburner.NS) {
  const server = ns.args[0] as string;

  const path = trace(ns, server);

  if (!path) {
    ns.tprint(`No path to ${server}`);
    return;
  }

  ns.tprint(path);
  execCommand(
    path
      .slice(1)
      .map((p) => `connect ${p}`)
      .join("; "),
  );
}
