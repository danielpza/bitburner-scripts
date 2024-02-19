async function start(ns: Bitburner.NS, script: string, args: string[]) {
  const isRunning = ns.scriptRunning(script, "home");

  if (!isRunning) {
    const pid = ns.run(script, 1, ...args);
    await ns.asleep(500);
    ns.kill(pid);
  }
}

export async function main(ns: Bitburner.NS) {
  await start(ns, "nuke-all.js", ["--loop"]);
  await start(ns, "brain.js", ["--loop"]);
  await start(ns, "servers.js", ["loop"]);
  await start(ns, "contracts/find.js", ["--loop"]);
  await start(ns, "scripts/toggle-share.js", ["--loop"]);
}
