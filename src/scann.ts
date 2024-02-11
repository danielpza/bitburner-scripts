import {
  formatFloat,
  formatInteger,
  formatMoney,
  formatPercent,
  formatTime,
  HeaderInfo,
  formatTable,
  scanAll,
  readJSON,
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

const flags: Bitburner.Flags = [
  ["orgname", false],
  ["daemon", false],
  // ['deep', false],
  // ['sort', false],
  ["filter", ""],
  ["all", false],
  ["max-sec", Number.MAX_SAFE_INTEGER],
  ["min-money", 0],
  ["min-hack-chance", 0],
  ["desc-sec", false],
  ["help", false],
  ["time", false],
  ["sec", false],
];

export function autocomplete(data: Bitburner.AutocompleteData) {
  data.flags(flags);
  return [...data.servers];
}

export async function main(ns: Bitburner.NS) {
  const {
    daemon,
    // sort,
    filter,
    ["max-sec"]: maxSec,
    ["min-hack-chance"]: minHackChance,
    ["min-money"]: money,
    ["desc-sec"]: descSec,
    orgname,
    all,
    help,
    time,
    sec,
  } = ns.flags(flags);

  const logFile = "grow-data.txt";

  const growPerThread = readJSON<Record<string, number>>(ns, logFile) ?? {};

  if (help) {
    ns.tprint(HELP);
    return;
  }

  ns.disableLog("sleep");

  const showInfo = () => {
    const hosts = scanAll(ns);

    let servers = hosts.map((host) => ns.getServer(host));

    if (!all) servers = servers.filter((server) => server.hasAdminRights);

    if (filter) {
      const regexp = new RegExp(filter as string, "i");
      servers = servers.filter(
        (server) =>
          server.hostname.match(regexp) || server.organizationName.match(regexp)
      );
    }

    servers = servers.filter(
      (server) =>
        server.moneyAvailable >= money &&
        server.minDifficulty <= maxSec &&
        ns.hackAnalyzeChance(server.hostname) * 100 >= minHackChance
    );

    // if (sort)
    servers = servers.sort((a, b) => b.moneyMax - a.moneyMax);
    // servers = sortBy(servers, (v) => -v.requiredHackingSkill)

    if (descSec) {
      let prev = servers[0].hackDifficulty;
      servers = servers.filter((server, i) => {
        if (i === 0) return true;
        if (server.hackDifficulty < prev) {
          prev = server.hackDifficulty;
          return true;
        }
        return false;
      });
    }

    const headerInfo: Record<string, HeaderInfo<Server>> = {
      hostname: { name: "root" },
      moneyAvailable: { name: "money", format: formatMoney },
      moneyMax: { name: "total money", format: formatMoney },
      hackDifficulty: { name: "sec", format: formatFloat },
      minDifficulty: { name: "min sec", format: formatFloat },
      requiredHackingSkill: { name: "skill", format: formatInteger },
      hackChance: {
        name: "hack%",
        value: (server) => ns.hackAnalyzeChance(server.hostname),
        format: formatPercent,
      },
      hackTime: {
        name: "hackTime",
        value: (server) => ns.getHackTime(server.hostname),
        format: formatTime,
      },
      growTime: {
        name: "growTime",
        value: (server) => ns.getGrowTime(server.hostname),
        format: formatTime,
      },
      weakenTime: {
        name: "weakenTime",
        value: (server) => ns.getWeakenTime(server.hostname),
        format: formatTime,
      },
      grow: {
        name: "grow",
        value: (server) => {
          const maxMoney = ns.getServerMaxMoney(server.hostname);
          const money = ns.getServerMoneyAvailable(server.hostname);
          if (maxMoney) {
            const increase = maxMoney - money;
            const threads = ns.growthAnalyze(server.hostname, maxMoney / money);
            return increase ** (1 / threads) - 1;
          }
          return null;
        },
        // format: formatFloat,
      },
      growPerThread: {
        name: "g/t",
        value: (server) => growPerThread[server.hostname] - 1,
        format: formatPercent,
      },
    };

    return formatTable(
      [
        "hostname",
        "moneyAvailable",
        "moneyMax",
        ...(sec ? ["hackDifficulty", "minDifficulty"] : []),
        "requiredHackingSkill",
        "hackChance",
        ...(time ? ["hackTime", "growTime", "weakenTime"] : []),
        "serverGrowth",
        ...(orgname ? ["organizationName"] : []),
        "growPerThread",
        "grow",
      ].map((header) =>
        header in headerInfo
          ? { value: _.iteratee(header), ...headerInfo[header] }
          : header
      ) as HeaderInfo<Server>[],
      servers
    );
  };

  if (daemon) {
    ns.tail();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      ns.print("\n", showInfo());
      await ns.sleep(10 * 1000);
    }
  } else {
    ns.tprint("\n", showInfo());
  }
}

function getBaseLog(base: number, y: number) {
  return Math.log(y) / Math.log(base);
}
