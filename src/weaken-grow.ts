import { growTarget } from "./grow.ts";
import { SLEEP } from "./utils/constants.ts";
import { canFullyWeaken, weakenTarget } from "./weaken.ts";

export async function weakenGrowTarget(ns: Bitburner.NS, target: string) {
  while (!canFullyWeaken(ns, target)) await weakenTarget(ns, target);

  await Promise.all([
    weakenTarget(ns, target),
    growTarget(ns, target, { extraDelay: SLEEP * 2 }),
  ]);
}
