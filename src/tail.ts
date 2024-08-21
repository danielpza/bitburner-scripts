const HEIGHT = 62;

export function main(ns: Bitburner.NS) {
  const processes = ns
    .ps()
    .filter((process) => process.filename !== "tail.js" && !process.filename.includes("scripts/"));

  const [ww, _wh] = ns.ui.windowSize();
  let height = 0;
  for (let i = 0; i < processes.length; i++) {
    const process = processes[i];

    const tailProperties = ns.getRunningScript(process.pid)?.tailProperties;
    if (!tailProperties) continue;

    ns.tail(process.pid);
    ns.moveTail(ww - tailProperties.width - 200, height, process.pid);
    height += HEIGHT;
  }
}
