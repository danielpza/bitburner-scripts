export function remoteExec(
  ns: Bitburner.NS,
  {
    script,
    host,
    threads = 1,
    target,
    delay = 0,
  }: {
    script: string;
    host: string;
    threads?: number;
    target: string;
    delay?: number;
  },
) {
  ns.scp(script, host);
  return ns.exec(script, host, { threads }, target, "--delay", delay);
}
