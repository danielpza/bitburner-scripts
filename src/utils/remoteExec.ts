import { RunOptions } from "../../NetScriptDefinitions.js";
import { ProcessCleanup } from "./ProcessCleanup.ts";

export interface RemoteExecOptionsOld {
  script: string;
  host: string;
  threads?: number;
  target: string;
  delay?: number;
}

export function remoteExecOld(
  ns: Bitburner.NS,
  { script, host, threads, target, delay = 0 }: RemoteExecOptionsOld,
) {
  ns.scp(script, host);
  let pid = ns.exec(script, host, { threads }, target, "--delay", delay);
  ProcessCleanup.get(ns).add(pid);
}

export interface RemoteExecOptions {
  script: string;
  threads?: RunOptions["threads"];
  args: (string | number | boolean)[];
}

export function remoteExec(
  ns: Bitburner.NS,
  host: string,
  { script, args, threads }: RemoteExecOptions,
) {
  ns.scp(script, host);
  let pid = ns.exec(script, host, { threads }, ...args);
  ProcessCleanup.get(ns).add(pid);
}
