import { clusterExec } from "./utils/clusterExec.ts";
import { Jobs, Script } from "./utils/constants.ts";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";
import { stackTail } from "./utils/stackTail.ts";

export async function main(ns: Bitburner.NS) {
  const cluster = getRootAccessServers(ns);
  const RAM = ns.getScriptRam(Script.SHARE);
  const threads = getClusterFreeThreads(ns, cluster, RAM);

  ns.disableLog("ALL");

  stackTail(ns, 6);

  while (true) {
    ns.print(`sharing ${threads} threads`);
    clusterExec(ns, cluster, Jobs.Share(threads));
    await ns.asleep(10_100);
  }
}
