import { RunOptions } from "../../NetScriptDefinitions.js";
import { ProcessCleanup } from "./ProcessCleanup.ts";

export interface RemoteExecOptions {
  script: string;
  threads?: RunOptions["threads"];
  args: (string | number | boolean)[];
}

export function remoteExec(ns: Bitburner.NS, host: string, { script, args, threads }: RemoteExecOptions) {
  ns.scp(script, host);
  let pid = ns.exec(script, host, { threads }, ...args);
  ProcessCleanup.get(ns).add(pid);
}
