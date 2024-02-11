import { Flags } from "./flags-helper";

const flags = new Flags(
  {
    loop: { type: "number" },
    delay: { type: "number" },
  },
  { servers: true }
);

export const autocomplete = flags.autocomplete;

export async function main(ns: Bitburner.NS) {
  const {
    _: [host],
    loop,
    delay,
  } = flags.parse(ns);

  if (delay) await ns.sleep(delay);

  const doit = async () => {
    await ns.hack(host);
    if (loop) await ns.sleep(loop);
  };

  if (loop)
    // eslint-disable-next-line no-constant-condition
    while (true) await doit();
  else await doit();
}
