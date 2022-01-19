import { formatTable, formatMoney, formatFloat } from "./shared.js";

const flags: Flags = [
  ["daemon", false],
  ["time", 0.3],
];

export function autocomplete(data: AutocompleteData) {
  data.flags(flags);
  return [...data.servers];
}

export async function main(ns: NS) {
  const {
    _: [host],
    daemon,
    time,
  } = ns.flags(flags);

  ns.disableLog("sleep");

  const show = () => {
    const server = ns.getServer(host);

    return formatTable(
      [
        "hostname",
        {
          name: "money",
          value: (server: Server) =>
            `${formatMoney(server.moneyAvailable)}/${formatMoney(
              server.moneyMax
            )}`,
        },
        {
          name: "sec",
          value: (server) =>
            `${formatFloat(server.hackDifficulty)}/${formatFloat(
              server.minDifficulty
            )}`,
        },
      ],
      [server]
    );
  };

  if (daemon) {
    ns.tail();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      ns.print(show());
      await ns.sleep((time as number) * 1000);
    }
  }

  ns.tprint("\n" + show());
}
