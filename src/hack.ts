export function autocomplete(data: Bitburner.AutocompleteData) {
  return data.servers;
}

const SLEEP = 100;

export async function main(ns: Bitburner.NS) {
  const [target] = ns.args as string[];

  ns.tail();

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
    const ram = ns.getScriptRam(script);
    return Math.floor(freeRam / ram);
  }

  async function doHack() {
    const hackTime = ns.getHackTime(target);
    const script = "dummy-hack.js";
    ns.run(script, { threads: howManyThreadsCanRun(script) }, target);
    await ns.sleep(hackTime + SLEEP);
  }

  async function doGrow() {
    const growTime = ns.getGrowTime(target);
    const script = "dummy-grow.js";
    ns.run(script, { threads: howManyThreadsCanRun(script) }, target);
    await ns.sleep(growTime + SLEEP);
  }

  async function doWeaken() {
    const weakenTime = ns.getWeakenTime(target);
    const script = "dummy-weaken.js";
    ns.run(script, { threads: howManyThreadsCanRun(script) }, target);
    await ns.asleep(weakenTime + SLEEP);
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
