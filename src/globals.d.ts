type Flags = [string, string | number | boolean][];

// https://docs.skypack.dev/skypack-cdn/code/javascript#using-skypack-urls-in-typescript
declare module "https://*";
declare module "https://cdn.skypack.dev/react" {
  export * from "react";
}
declare module "https://cdn.skypack.dev/react-dom" {
  export * from "react-dom";
}
declare module "https://cdn.skypack.dev/react-draggable" {
  export * from "react-draggable";
}
declare module "https://cdn.skypack.dev/@mui/material" {
  export * from "@mui/material";
}

declare const _: import("lodash")._;

interface AutocompleteData {
  flags(flags: Flags): void;
  servers: string[];
  txt: string[];
  scripts: srting[];
}

interface Server {
  hostname: string;
  hasAdminRights: number;
  moneyAvailable: number;
  minDifficulty: number;
  moneyMax: number;
  hackDifficulty: number;
  organizationName: string;
}

interface Player {
  money: number;
}

/** @see https://github.com/danielyxie/bitburner/blob/dev/markdown/bitburner.ns.md */
interface NS {
  args: string[];

  scan(host: string): string[];
  getHostname(): string;
  getServer(host: string): Server;
  getPlayer(): Player;

  read(handle: string): string;
  write(
    handle: string,
    data?: string[] | number | string,
    mode?: "w" | "a"
  ): Promise<void>;

  flags(
    flags: Flags
  ): Record<string, number | boolean | string> & { _: string[] };
  atExit(cb: () => void): void;
  sleep(time: number): Promise<void>;
  asleep(time: number): Promise<void>;

  getPurchasedServerCost(ram: number): number;

  killall(host: string): void;
  tail(): void;

  prompt(msg: string): Promise<boolean>;
  print(...args: unknown[]): void;
  tprint(...args: unknown[]): void;
  enableLog(script: string): void;
  disableLog(script: string): void;

  getPurchasedServers(): string[];
  purchaseServer(name: string, ram: number): void;

  // hacking
  scp(file: string | string[], host: string, target: string): Promise<void>;
  exec(
    script: string,
    host: string,
    threads: number,
    ...args: (string | number)[]
  ): void;
  hack(target: string): Promise<number>;
  grow(target: string): Promise<number>;
  weaken(target: string): Promise<number>;

  // info
  getHackingLevel(): number;

  // server ram
  getServerMaxRam(host: string): number;
  getServerUsedRam(host: string): number;
  getScriptRam(host: string): number;

  // server info
  hasRootAccess(host: string): boolean;

  getServerRequiredHackingLevel(host: string): number;

  getServerMoneyAvailable(host: string): number;
  getServerMaxMoney(host: string): number;

  getServerSecurityLevel(host: string): number;
  getServerMinSecurityLevel(host: string): number;

  getServerGrowth(host: string): number;

  getWeakenTime(host: string): number;
  getGrowTime(host: string): number;
  getHackTime(host: string): number;

  weakenAnalyze(threads: number, cores?: number): number;

  /**
   * Depends on security and player hack level
   *
   * @returns Total money percent result of hacking with a single threads
   */
  hackAnalyze(host: string): number;
  hackAnalyzeChance(host: string): number;
  hackAnalyzeThreads(host: string, hackAmount: number): number;
  /**
   * Depends on security and player hack level
   *
   * @returns Threads needed to increase server money in a certain proportion
   *   (`growthAmount`)
   */
  growthAnalyze(host: string, growthAmount: number, cores?: number): number;
}
