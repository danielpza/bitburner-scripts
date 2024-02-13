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
  return ns.exec(script, host, { threads }, target, "--delay", delay);
}
