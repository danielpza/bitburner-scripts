import { Flags } from "./flags-helper";
import { formatRam, formatMoney, formatTable } from "./shared";

const flags = new Flags(
  {
    list: { type: "boolean" },
    times: { type: "number", default: 1 },
    name: { type: "string", default: "" },
  },
  {
    values: Array.from({ length: 20 }, (_, i) => (2 ** i).toString()),
  }
);

export async function main(ns: Bitburner.NS) {
  const {
    _: [value],
    list,
    times,
  } = flags.parse(ns);

  if (list) {
    ns.tprint(
      "\n",
      formatTable(
        [
          { name: "ram", format: formatRam },
          { name: "price", format: formatMoney },
        ],
        Array.from({ length: 20 }, (_, i) => ({
          ram: 2 ** i,
          price: ns.getPurchasedServerCost(2 ** i),
        }))
      )
    );
    return;
  }

  const ram = Number(value);

  if (!Number.isFinite(ram)) throw new Error("Must enter number of gb");

  const cost = ns.getPurchasedServerCost(ram);

  const confirm = await ns.prompt(
    `Are you sure you want to buy ${times} ${ram}Gb server for ${formatMoney(
      cost
    )} each, total ${formatMoney(times * cost)}`
  );

  if (!confirm) {
    return;
  }

  for (let i = 0; i < times; i++) {
    const name = `server${ram}_${ns.getPurchasedServers().length + 1}`;
    ns.purchaseServer(name, ram);
  }
}
