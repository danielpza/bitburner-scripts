import { scanAll } from "./utils/scanAll.ts";

export function main(ns: Bitburner.NS) {
  const servers = scanAll(ns);
  ns.tprint("\n", servers.join("\n"));
}
