import { Flags } from "./flags-helper.js";
import { formatTable, formatMoney, formatFloat } from "./shared.js";

const flags = new Flags(
  {
    daemon: { type: "boolean" },
    time: { type: "number", default: 0.3 },
  },
  { servers: true }
);

export const autocomplete = flags.autocomplete;

export async function main(ns: Bitburner.NS) {
  const {
    _: [host],
    daemon,
    time,
  } = flags.parse(ns);

  ns.disableLog("sleep");

  const show = () => {
    const server = ns.getServer(host);

    return formatTable(
      [
        "hostname",
        {
          name: "money",
          value: (server: Bitburner.Server) =>
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
      await ns.sleep(time * 1000);
    }
  }

  ns.tprint("\n" + show());
}
