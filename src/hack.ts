const flags: Flags = [
  ["loop", 0],
  ["delay", 0],
];

export function autocomplete(data: Bitburner.AutocompleteData) {
  data.flags(flags);
  return [...data.servers];
}

export async function main(ns: Bitburner.NS) {
  const {
    _: [host],
    loop,
    delay,
  } = ns.flags(flags);

  if (delay) await ns.sleep(delay as number);

  const doit = async () => {
    await ns.hack(host);
    if (loop) await ns.sleep(loop as number);
  };

  if (loop)
    // eslint-disable-next-line no-constant-condition
    while (true) await doit();
  else await doit();
}
