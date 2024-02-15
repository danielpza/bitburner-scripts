export const SLEEP = 75;

export const HACK_ANALYZE_SEC = 0.002; // ns.hackAnalyzeSecurity(1);
export const GROW_ANALYZE_SEC = 0.004; // ns.growthAnalyzeSecurity(1);
export const WEAK_ANALYZE = 0.05; // ns.weakenAnalyze(1);

export const GROW_PER_WEAK = WEAK_ANALYZE / GROW_ANALYZE_SEC;
export const HACK_PER_WEAK = WEAK_ANALYZE / HACK_ANALYZE_SEC;

export enum Script {
  HACK = "scripts/dummy-hack.js",
  GROW = "scripts/dummy-grow.js",
  WEAKEN = "scripts/dummy-weaken.js",
}

export const TARGET_HACK_PERCENT = 0.1;
