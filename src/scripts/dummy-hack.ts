export async function main(ns: Bitburner.NS) {
  const {
    _: [host],
    delay,
  } = ns.flags([["delay", 0]]) as { _: [string]; delay: number };

  if (delay) await ns.sleep(delay);

  await ns.hack(host);
}
