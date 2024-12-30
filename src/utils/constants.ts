export const SLEEP = 25;

export const HACK_ANALYZE_SEC = 0.002; // ns.hackAnalyzeSecurity(1);
export const GROW_ANALYZE_SEC = 0.004; // ns.growthAnalyzeSecurity(1);
export const WEAK_ANALYZE = 0.05; // ns.weakenAnalyze(1);

export const GROW_PER_WEAK = WEAK_ANALYZE / GROW_ANALYZE_SEC;
export const HACK_PER_WEAK = WEAK_ANALYZE / HACK_ANALYZE_SEC;

export enum Script {
  HACK = "scripts/dummy-hack.ts",
  GROW = "scripts/dummy-grow.ts",
  WEAKEN = "scripts/dummy-weaken.ts",
  SHARE = "scripts/dummy-share.ts",
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

export const MAX_SHARE_THREADS = 100_000;

export const TARGET_FILE = "state/target.txt";

export const Colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  yellow: "\x1b[33m",
  black: "\x1b[30m",
  white: "\x1b[37m",
  default: "\x1b[0m",
};
