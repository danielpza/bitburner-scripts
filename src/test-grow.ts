import { scanAll, readJSON } from "./shared.js";

export async function main(ns: Bitburner.NS) {
  // const { daemon, logFile } = ns.flags() as unknown as {
  //   daemon: boolean;
  //   logFile: string;
  // };

  ns.disableLog("ALL");
  ns.enableLog("grow");

  const readLogs = () => readJSON<Record<string, string>>(ns, logFile) ?? {};

  const serverIsFull = (server: string) =>
    _.round(ns.getServerMoneyAvailable(server), 2) ===
    _.round(ns.getServerMaxMoney(server), 2);

  const getNextServer = () => {
    const servers = scanAll(ns);
    const json = readLogs();
    const skip = new Set(Object.keys(json));
    const filtered = servers.filter(
      (s) =>
        !skip.has(s) && ns.getServerMoneyAvailable(s) > 0 && !serverIsFull(s)
    );
    const sorted = _.sortBy(filtered, (s) => ns.getGrowTime(s));
    return sorted[0];
  };

  while (true) {
    const server = getNextServer();
    if (!server) {
      log("no server to inspect, quitting");
      break;
    }

    log(`inspecting ${server}`);

    const result = await ns.grow(server);

    if (serverIsFull(server)) {
      log(`${server} at max capacity after grow, skipping`);
      continue;
    }

    log(`server ${server} grow rate is ${result}`);

    await writeJSON(ns, logFile, { ...readLogs(), [server]: result });
  }
}
