import { table } from "./utils/table";

export async function main(ns: Bitburner.NS) {
  const {
    _: [value],
    list,
    times,
  } = ns.flags([
    ["list", false],
    ["times", 1],
    ["name", ""],
  ]) as { _: [string]; list: boolean; times: number; name: string };

  if (list) {
    ns.tprint(
      "\n",
      table(
        Array.from({ length: 20 }, (_, i) => ({
          ram: 2 ** i,
          price: ns.getPurchasedServerCost(2 ** i),
        })),
        [{ header: "ram" }, { header: "price", format: ns.formatNumber }],
      ),
    );
    return;
  }

  let ram = Number(value);

  if (!Number.isFinite(ram))
    ram = Number(
      await ns.prompt("Enter the amount of RAM", {
        type: "select",
        choices: Array.from({ length: 20 }, (_, i) => String(2 ** i)),
      }),
    );

  if (!ram) return;

  for (let i = 0; i < times; i++) {
    const name = `server${ram}_${ns.getPurchasedServers().length + 1}`;
    ns.purchaseServer(name, ram);
  }
}
