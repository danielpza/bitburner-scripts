import { table } from "./utils/table";

export async function main(ns: Bitburner.NS) {
  const {
    _: [value],
    list,
    times,
    quick,
  } = ns.flags([
    ["list", false],
    ["times", 1],
    ["name", ""],
    ["quick", false],
  ]) as {
    _: [string];
    list: boolean;
    times: number;
    name: string;
    quick: boolean;
  };

  const choices = Array.from({ length: 20 }, (_, i) => ({
    ram: 2 ** i,
    price: ns.getPurchasedServerCost(2 ** i),
  }));

  if (list) {
    ns.tprint(
      "\n",
      table(choices, [
        { header: "ram" },
        { header: "price", format: ns.formatNumber },
      ]),
    );
    return;
  }

  let ram = Number(value);

  if (quick) {
    // get biggest server that can buy
    for (
      ram = 1;
      ns.getPurchasedServerCost(ram) <= ns.getPlayer().money;
      ram *= 2
    ) {}
    ram /= 2;
  }

  if (!Number.isFinite(ram))
    ram = Number(
      await ns.prompt("Enter the amount of RAM", {
        type: "select",
        choices: choices.map((choice) => String(choice.ram)),
      }),
    );

  if (!ram) return;

  for (let i = 0; i < times; i++) {
    const name = `server${ram}_${ns.getPurchasedServers().length + 1}`;
    ns.purchaseServer(name, ram);
  }
}
