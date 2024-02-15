const RAM_BUFFER = 10;

export function getFreeRam(ns: Bitburner.NS, host: string) {
  const total = ns.getServerMaxRam(host);
  const used = ns.getServerUsedRam(host);
  if (host === "home") return Math.max(0, total - used - RAM_BUFFER);
  return total - used;
}
