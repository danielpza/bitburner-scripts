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
  ProcessCleanup.get(ns).add([pid]);
}
