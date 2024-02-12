export async function main(ns: Bitburner.NS) {
  const {
    _: [host],
    delay,
  } = ns.flags([["delay", 0]]) as { _: [string]; delay: number };

  await ns.grow(host, { additionalMsec: delay });
}
