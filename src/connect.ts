import { trace } from "./shared.js";
import { execCommand } from "./dom.js";
import { Flags } from "./flags-helper.js";

const flags = new Flags({}, { servers: true });

export const autocomplete = flags.autocomplete;

// eslint-disable-next-line @typescript-eslint/require-await
export async function main(ns: Bitburner.NS) {
  const {
    _: [server],
  } = flags.parse(ns);

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
