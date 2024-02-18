export const SLEEP = 25;

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

function Task<T extends any[] = []>(script: string, cb?: (...args: T) => (string | number | boolean)[]) {
  const func = (threads: number, ...args: T) => ({
    script,
    threads,
    args: cb?.(...args) ?? [],
  });
  func.script = script;
  return func;
}

const HGW = (script: string) => Task(script, (target: string, delay: number = 0) => [target, "--delay", delay]);

export const Jobs = {
  HGW: (script: string, threads: number, target: string, delay: number = 0) => ({
    script,
    threads,
    args: [target, "--delay", delay],
  }),
  Weaken: HGW(Script.WEAKEN),
  Grow: HGW(Script.GROW),
  Hack: HGW(Script.HACK),
  Share: Task(Script.SHARE),
} satisfies Record<
  string,
  (...args: any[]) => {
    threads: number;
    args: (string | number | boolean)[];
    script: string;
  }
>;

export const TARGET_HACK_PERCENT = 0.1;

export const MAX_HACK_CYCLES = 300;

export const HACK_SKILL_THRESHOLD = 2.5;

export const SHARE_FILE = "state/share.txt";

export enum ShareToggle {
  off = "off",
  on = "on",
}

export const TARGET_FILE = "state/target.txt";
