export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const SLEEP = 100;

function getServers(ns: Bitburner.NS) {
  return ns.scan();
}

function getRootAccessServers(ns: Bitburner.NS) {
  return getServers(ns).filter((server) => ns.hasRootAccess(server));
}

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.tail();

  let pids: number[] = [];

  ns.atExit(() => {
    for (const pid of pids) {
      ns.kill(pid);
    }
  });

  const getScriptRam = _.memoize(ns.getScriptRam);

  for (;;) {
    if (canLowerSecurity()) await doWeaken();
    else if (canGrow()) await doGrow();
    else await doHack();
  }

  function getFreeRam(host: string) {
    const total = ns.getServerMaxRam(host);
    const used = ns.getServerUsedRam(host);
    return total - used;
  }

  function howManyThreadsCanRun(script: string, host = ns.getHostname()) {
    const freeRam = getFreeRam(host);
    const ram = getScriptRam(script);
    return Math.floor(freeRam / ram);
  }

  async function doScript(script: string, time: number) {
    const host = getFreeServer();
    ns.scp(script, host);
    let pid = ns.exec(
      script,
      host,
      { threads: howManyThreadsCanRun(script, host) },
      target,
    );
    pids = [pid];
    await ns.sleep(time + SLEEP);
    pids = [];
  }

  function getFreeServer() {
    return _.orderBy(
      getRootAccessServers(ns),
      [getFreeRam, (host) => (host === "home" ? 1 : 0)],
      ["desc", "asc"],
    )[0];
  }

  async function doHack() {
    return doScript("dummy-hack.js", ns.getHackTime(target));
  }

  async function doGrow() {
    return doScript("dummy-grow.js", ns.getGrowTime(target));
  }

  async function doWeaken() {
    return doScript("dummy-weaken.js", ns.getWeakenTime(target));
  }

  function canLowerSecurity() {
    return (
      ns.getServerMinSecurityLevel(target) < ns.getServerSecurityLevel(target)
    );
  }

  function canGrow() {
    return ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target);
  }
}
