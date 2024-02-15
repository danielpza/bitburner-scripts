import { RunOptions } from "../../NetScriptDefinitions.js";
import { ProcessCleanup } from "./ProcessCleanup.ts";

export interface RemoteExecOptions {
  script: string;
  host: string;
  threads?: number;
  target: string;
  delay?: number;
}

export function remoteExec(
  ns: Bitburner.NS,
  { script, host, threads, target, delay = 0 }: RemoteExecOptions,
) {
  ns.scp(script, host);
  let pid = ns.exec(script, host, { threads }, target, "--delay", delay);
  ProcessCleanup.get(ns).add(pid);
}

export interface RemoteExec2Options {
  script: string;
  threads?: RunOptions["threads"];
  args: (string | number | boolean)[];
}

export function remoteExec2(
  ns: Bitburner.NS,
  host: string,
  { script, args, threads }: RemoteExec2Options,
) {
  ns.scp(script, host);
  let pid = ns.exec(script, host, { threads }, ...args);
  ProcessCleanup.get(ns).add(pid);
}
