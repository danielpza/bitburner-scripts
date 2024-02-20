import { trace } from "./trace.ts";

export function connectTo(ns: Bitburner.NS, target: string) {
  const path = trace(ns, target, ns.getHostname())?.slice(1);

  if (!path) {
    throw new Error(`Cannot reach ${target}`);
  }

  for (const server of path) {
    if (!ns.singularity.connect(server)) continue;
  }

  return true;
}
