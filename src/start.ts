const WIDTH = 200;
const HEIGHT = 62;

function start(ns: Bitburner.NS, script: string, args: string[], i: number, w = WIDTH) {
  let runningScript = ns.getRunningScript(script, "home", ...args);
  let isRunning = !!runningScript;

  if (!isRunning) {
    const pid = ns.run(script, 1, ...args);
    runningScript = ns.getRunningScript(pid, "home");
    ns.tail(pid);
    ns.resizeTail(w, HEIGHT, pid);
    runningScript = ns.getRunningScript(pid, "home");
  }

  if (!runningScript) return;

  const [ww, _wh] = ns.ui.windowSize();

  // ns.tail(process.pid);
  ns.moveTail(ww - (runningScript.tailProperties?.width ?? 0) - 200, i * HEIGHT, runningScript.pid);

  if (!isRunning) ns.kill(runningScript!.pid);
}

export async function main(ns: Bitburner.NS) {
  start(ns, "brain.js", ["--loop"], 0, 1000);
  start(ns, "servers.js", ["loop"], 1);
  start(ns, "contracts/find.js", ["--loop"], 2);
  start(ns, "scripts/toggle-share.js", ["--loop"], 3);
}
