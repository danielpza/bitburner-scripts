import { scanAll } from "./shared.js";

const flags: Flags = [
  ["logFile", "grow-data.txt"],
  ["daemon", false],
];

function readJSON<T>(ns: NS, file: string): T | undefined {
  const content = ns.read(file);
  if (content === "") return undefined;
  return JSON.parse(content);
}

function writeJSON(ns: NS, file: string, content: unknown): Promise<void> {
  return ns.write(file, JSON.stringify(content), "w");
}

export function autocomplete(data: AutocompleteData) {
  data.flags(flags);
  return [...data.txt];
}

export async function main(ns: NS) {
  const { daemon, logFile } = ns.flags(flags) as unknown as {
    daemon: boolean;
    logFile: string;
  };

  const log = daemon
    ? (text: any) => ns.print(text)
    : (text: any) => ns.tprint(text);

  if (daemon) {
    ns.tail();
  }

  ns.disableLog("ALL");

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

    const result = _.round(await ns.grow(server), 2);

    if (serverIsFull(server)) {
      log(`${server} at max capacity after grow, skipping`);
      continue;
    }

    log(`server ${server} grow rate is ${result}`);

    await writeJSON(ns, logFile, { ...readLogs(), [server]: result });
  }
}
