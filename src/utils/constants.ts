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
  SHARE = "scripts/dummy-share.js",
}

export const Job = {
  Weaken: (target: string, threads: number, delay: number) => ({
    script: Script.WEAKEN,
    threads,
    args: [target, "--delay", delay],
  }),
  Grow: (target: string, threads: number, delay: number) => ({
    script: Script.GROW,
    threads,
    args: [target, "--delay", delay],
  }),
  Hack: (target: string, threads: number, delay: number) => ({
    script: Script.HACK,
    threads,
    args: [target, "--delay", delay],
  }),
  Share: (threads: number) => ({
    script: Script.SHARE,
    threads,
    args: [],
  }),
} satisfies Record<
  string,
  (...args: any[]) => {
    threads: number;
    args: (string | number | boolean)[];
    script: string;
  }
>;

export const TARGET_HACK_PERCENT = 0.1;
