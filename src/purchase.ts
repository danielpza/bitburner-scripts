import { formatRam, formatMoney, formatTable } from "./shared";

const flags: Flags = [
  ["list", false],
  ["times", 1],
  ["name", ""],
];

const values = Array.from({ length: 20 }, (_, i) => (2 ** i).toString());

export function autocomplete(data: AutocompleteData) {
  data.flags(flags);
  return [...values];
}

export async function main(ns: NS) {
  const {
    _: [value],
    list,
    times,
  } = ns.flags(flags);

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
    `Are you sure you want to buy ${
      times as number
    } ${ram}Gb server for ${formatMoney(cost)} each, total ${formatMoney(
      (times as number) * cost
    )}`
  );

  if (!confirm) {
    return;
  }

  for (let i = 0; i < times; i++) {
    const name = `server${ram}_${ns.getPurchasedServers().length + 1}`;
    ns.purchaseServer(name, ram);
  }
}
