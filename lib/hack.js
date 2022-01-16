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
  if (delay)
    await ns.sleep(delay);
  if (loop)
    while (true)
      await ns.hack(host);
  else
    await ns.hack(host);
}
