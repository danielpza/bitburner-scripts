import { formatTable, formatMoney, formatFloat } from "./shared.js";
const flags = [
  ["daemon", false],
  ["time", 1]
];
export function autocomplete(data) {
  data.flags(flags);
  return [...data.servers];
}
export async function main(ns) {
  const {
    _: [host],
    daemon,
    time
  } = ns.flags(flags);
  ns.disableLog("sleep");
  const show = () => {
    const server = ns.getServer(host);
    return formatTable([
      "hostname",
      {
        name: "money",
        value: (server2) => `${formatMoney(server2.moneyAvailable)}/${formatMoney(server2.moneyMax)}`
      },
      {
        name: "sec",
        value: (server2) => `${formatFloat(server2.hackDifficulty)}/${formatFloat(server2.minDifficulty)}`
      }
    ], [server]);
  };
  if (daemon) {
    ns.tail();
    while (true) {
      ns.print(show());
      await ns.sleep(time * 1e3);
    }
  }
  ns.tprint("\n" + show());
}
