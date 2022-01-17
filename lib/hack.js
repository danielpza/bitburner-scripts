const flags = [
  ["loop", 0],
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
  if (delay)
    await ns.sleep(delay);
  const doit = async () => {
    await ns.hack(host);
    if (loop)
      await ns.sleep(loop);
  };
  if (loop)
    while (true)
      await doit();
  else
    await doit();
}
