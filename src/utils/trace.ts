export function trace(
  ns: Bitburner.NS,
  target: string,
  host = ns.getHostname(),
  visited = new Set<string>(),
): string[] | null {
  visited.add(host);

  const children = ns.scan(host).filter((child) => !visited.has(child));

  for (const child of children) {
    if (child === target) {
      return [host, target];
    }

    const path = trace(ns, target, child, visited);

    if (path) {
      return [host, ...path];
    }
  }

  return null;
}
