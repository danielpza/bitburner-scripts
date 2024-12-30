/**
 * Returns a list of all servers available in the game
 *
 * @example
 *   const allServers = scanAll(ns);
 */
export function scanAll(ns: Bitburner.NS, target = "home", visited = new Set()): string[] {
  visited.add(target);

  return ns
    .scan(target)
    .filter((child) => !visited.has(child))
    .flatMap((child) => [child, ...scanAll(ns, child, visited)]);
}
