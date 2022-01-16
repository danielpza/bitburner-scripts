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

  const doit = async () => {
    if (delay) await ns.sleep(delay as number);
    await ns.hack(host);
  };

  if (loop)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await doit();
    }
  else await doit();
}
