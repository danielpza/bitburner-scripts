const flags = [
  ["loop", false],
  ["delay", 0]
];
export function autocomplete(data) {
  data.flags(flags);
  return [...data.servers];
}
export async function main(ns) {
  const {
    _: [host],
    loop,
    delay
  } = ns.flags(flags);
  const doit = async () => {
    if (delay)
      await ns.sleep(delay);
    await ns.hack(host);
  };
  if (loop)
    while (true) {
      await doit();
    }
  else
    await doit();
}
