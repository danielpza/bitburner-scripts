import {
  formatFloat,
  formatInteger,
  formatMoney,
  formatPercent,
  formatTime,
  formatTable,
  scanAll
} from "./shared.js";
const NAME = "scann";
const HELP = `
${NAME}

--filter text
--max-sec number
--min-money number
--min-hack-chance number
--desc-sec
--daemon
--help
--orgname

Example
  ${NAME} --sort
`;
const flags = [
  ["orgname", false],
  ["daemon", false],
  ["filter", ""],
  ["all", false],
  ["max-sec", Number.MAX_SAFE_INTEGER],
  ["min-money", 0],
  ["min-hack-chance", 0],
  ["desc-sec", false],
  ["help", false]
];
export function autocomplete(data) {
  data.flags(flags);
  return [...data.servers];
}
export async function main(ns) {
  const {
    daemon,
    filter,
    ["max-sec"]: sec,
    ["min-hack-chance"]: minHackChance,
    ["min-money"]: money,
    ["desc-sec"]: descSec,
    orgname,
    all,
    help
  } = ns.flags(flags);
  if (help) {
    ns.tprint(HELP);
    return;
  }
  ns.disableLog("sleep");
  const showInfo = () => {
    const hosts = scanAll(ns);
    let servers = hosts.map((host) => ns.getServer(host));
    if (!all)
      servers = servers.filter((server) => server.hasAdminRights);
    if (filter) {
      const regexp = new RegExp(filter, "i");
      servers = servers.filter((server) => server.hostname.match(regexp) || server.organizationName.match(regexp));
    }
    servers = servers.filter((server) => server.moneyAvailable >= money && server.minDifficulty <= sec && ns.hackAnalyzeChance(server.hostname) * 100 >= minHackChance);
    servers = servers.sort((a, b) => b.moneyMax - a.moneyMax);
    if (descSec) {
      let prev = servers[0].hackDifficulty;
      servers = servers.filter((server, i) => {
        if (i === 0)
          return true;
        if (server.hackDifficulty < prev) {
          prev = server.hackDifficulty;
          return true;
        }
        return false;
      });
    }
    const headerInfo = {
      hostname: { name: "root" },
      moneyAvailable: { name: "money", format: formatMoney },
      moneyMax: { name: "total money", format: formatMoney },
      hackDifficulty: { name: "sec", format: formatFloat },
      minDifficulty: { name: "min sec", format: formatFloat },
      requiredHackingSkill: { name: "skill", format: formatInteger },
      hackChance: {
        name: "hack%",
        value: (server) => ns.hackAnalyzeChance(server.hostname),
        format: formatPercent
      },
      hackTime: {
        name: "hackTime",
        value: (server) => ns.getHackTime(server.hostname),
        format: formatTime
      },
      growTime: {
        name: "growTime",
        value: (server) => ns.getGrowTime(server.hostname),
        format: formatTime
      },
      weakenTime: {
        name: "weakenTime",
        value: (server) => ns.getWeakenTime(server.hostname),
        format: formatTime
      }
    };
    return formatTable([
      "hostname",
      "moneyAvailable",
      "moneyMax",
      "hackDifficulty",
      "minDifficulty",
      "requiredHackingSkill",
      "hackChance",
      "hackTime",
      "growTime",
      "weakenTime",
      "serverGrowth",
      ...orgname ? ["organizationName"] : []
    ].map((header) => header in headerInfo ? { value: _.iteratee(header), ...headerInfo[header] } : header), servers);
  };
  if (daemon) {
    ns.tail();
    while (true) {
      ns.print("\n", showInfo());
      await ns.sleep(10 * 1e3);
    }
  } else {
    ns.tprint("\n", showInfo());
  }
}
