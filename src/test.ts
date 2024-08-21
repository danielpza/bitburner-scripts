// import { clusterExec } from "./utils/clusterExec.ts";
// import { Jobs } from "./utils/constants.ts";
// import { getClusterFreeThreads } from "./utils/getClusterFreeThreads.ts";
// import { getRootAccessServers } from "./utils/getRootAccessServers.ts";

export async function main(ns: Bitburner.NS) {
  if (false) {
    ns.tprint(ns.growthAnalyze("home"));
  }
  // const cluster = getRootAccessServers(ns);
  // let maxThreads = getClusterFreeThreads(ns, cluster, ns.getScriptRam(Jobs.Share.script));
  // let threads = 1;
  // let totalThreads = 0;
  // while (threads < maxThreads) {
  //   ns.tprint(`${totalThreads}: ${ns.formatNumber((ns.getSharePower() - 1) * 1000)}`);
  //   let newThreads = threads - totalThreads;
  //   clusterExec(ns, cluster, Jobs.Share(newThreads));
  //   totalThreads += newThreads;
  //   maxThreads -= newThreads;
  //   threads = threads * 10;
  //   await ns.asleep(1);
  // }
}

// // const COLORS = {
// //   RED: "\x1b[31m",
// //   GREEN: "\x1b[32m",
// //   YELLOW: "\x1b[33m",
// //   BLUE: "\x1b[34m",
// //   MAGENTA: "\x1b[35m",
// //   CYAN: "\x1b[36m",
// //   WHITE: "\x1b[37m",
// //   RESET: "\x1b[0m",
// // };

// // function red(str: string) {
// //   return COLORS.RED + str + COLORS.RESET;
// // }

// // ns.print(`Hello ${red("World")}`);
// You can also reset after changing the colors
// ```ts
// const COLORS = {
//   RED: "\x1b[31m",
//   /* snip other colors */
//   RESET: "\x1b[0m",
// };

// function red(str: string) {
//   return COLORS.RED + str + COLORS.RESET;
// }

// ns.print(`Hello ${red("World")}`);
// ns.tprint(`Hello ${red("World")}`);
// ```
