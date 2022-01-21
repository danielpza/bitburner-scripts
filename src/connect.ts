import { trace } from "./shared.js";
import { execCommand } from "./dom.js";

export function autocomplete(data: AutocompleteData) {
  return [...data.servers];
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function main(ns: NS) {
  const [server] = ns.args;

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
      .join("; ")
  );
}
