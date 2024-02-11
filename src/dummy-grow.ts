export async function main(ns: Bitburner.NS) {
  const [host] = ns.args as string[];
  await ns.grow(host);
}
