const flags: Flags = [
  ["loop", false],
  ["delay", 0],
];

export function autocomplete(data: AutocompleteData) {
  data.flags(flags);
  return [...data.servers];
}

export async function main(ns: NS) {
  const {
    _: [host],
    loop,
    delay,
  } = ns.flags(flags);

  if (delay) await ns.sleep(delay as number);

  // eslint-disable-next-line no-constant-condition
  if (loop) while (true) await ns.hack(host);
  else await ns.hack(host);
}
