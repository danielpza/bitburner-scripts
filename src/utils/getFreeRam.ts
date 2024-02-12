export function getFreeRam(ns: Bitburner.NS, host: string) {
  const total = ns.getServerMaxRam(host);
  const used = ns.getServerUsedRam(host);
  return total - used;
}
