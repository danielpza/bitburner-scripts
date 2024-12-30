import Table from "./components/Table";
import { useForceRender } from "./hooks/useForceRender";
import { useInterval } from "./hooks/useInterval";
import { render } from "./utils/render";

import { growTarget } from "./grow";
import { hackTarget } from "./hack";
import { nukeAll } from "./nuke-all";
import { weakenTarget } from "./weaken";
import { getClusterLoad } from "./utils/getClusterLoad";
import { getRootAccessServers } from "./utils/getRootAccessServers";
import { canEasyHack } from "./utils/info/canEasyHack";

function Dashboard({ ns }: { ns: Bitburner.NS }) {
  const [nuked, setNuked] = React.useState<string[]>([]);
  const refresh = useForceRender();
  const [targets, setTargets] = React.useState<
    Array<{
      host: string;
      action: "hack" | "grow" | "weaken";
      startTime: number;
      endTime: number;
    }>
  >([]);
  const loopRef = React.useRef(false);
  const load = getClusterLoad(ns);

  useInterval(refresh, 1000);

  let servers = getRootAccessServers(ns).filter((server) => {
    if (server === "home") return false;
    if (!ns.hasRootAccess(server)) return false;
    return true;
  });
  servers = _.orderBy(
    servers,
    [
      (server) => targets.some((target) => target.host === server),
      (server) => canEasyHack(ns, server),
      (server) => ns.getServerMoneyAvailable(server) > 0,
      (server) => bucket(ns.getWeakenTime(server)),
      (server) => bucket(ns.getServerMoneyAvailable(server)),
    ],
    ["desc", "desc", "desc", "asc", "desc"],
  );
  servers = servers.slice(0, 10);

  return (
    <>
      <button onClick={handleStop}>Stop</button>
      <button onClick={handleNukeAll}>Nuke</button>
      <label>
        Loop
        <input type="checkbox" onChange={handleCheckbox} />
      </label>
      <label>
        Load ({load.total - load.free}/{load.total}) {progress(load.total - load.free, load.total)}
      </label>
      {nuked.length ? "Nuked: " + nuked.join(", ") : ""}
      <br />
      <Table
        columns={[
          { label: "Server", getValue: (host) => host, formatter: (value) => value, align: "left" },
          { label: "Money", getValue: (host) => ns.getServerMoneyAvailable(host), formatter: formatMoney },
          { label: "Max Money", getValue: (host) => ns.getServerMaxMoney(host), formatter: formatMoney },
          { label: "Hack Time", getValue: (host) => ns.getHackTime(host), formatter: formatTime },
          { label: "Grow Time", getValue: (host) => ns.getGrowTime(host), formatter: formatTime },
          { label: "Weaken Time", getValue: (host) => ns.getWeakenTime(host), formatter: formatTime },
          {
            label: "Security",
            getValue: (host) => [ns.getServerSecurityLevel(host), ns.getServerMinSecurityLevel(host)],
            formatter: ([current, min]) => `${formatSec(current)}/${formatSec(min)}`,
          },
          // { label: "Max RAM", getValue: (host) => ns.getServerMaxRam(host), formatter: formatRam },
          // { label: "Threads", getValue: (host) => getFreeThreads(ns, host, hackRam), formatter: formatThread },
          // {
          //   label: "Load",
          //   getValue: (host) => ns.getServerUsedRam(host),
          //   formatter: (value, host) => progress(value, ns.getServerMaxRam(host)),
          // },
          {
            label: "Time Score",
            getValue: (host) => bucket(ns.getWeakenTime(host)),
          },
          {
            label: "Actions",
            getValue: (host) => host,
            formatter: (host) => {
              const target = targets.find((target) => target.host === host);
              if (target) {
                return (
                  <>
                    {target.action} {formatTime(target.endTime - Date.now())}{" "}
                    {progress(Date.now() - target.startTime, target.endTime - target.startTime)}
                  </>
                );
              }

              return (
                <div>
                  <button onClick={() => handleHack(host)}>H</button>
                  <button onClick={() => handleGrow(host)}>G</button>
                  <button onClick={() => handleWeaken(host)}>W</button>
                </div>
              );
            },
            align: "left",
          },
          // {
          //   label: "Progress",
          //   getValue: (host) => host,
          //   formatter: (host) => {
          //     const target = targets.find((target) => target.host === host);
          //     if (!target) return null;
          //     return progress(Date.now() - target.startTime, target.endTime - target.startTime);
          //   },
          // },
        ]}
        data={servers}
      />
    </>
  );

  function handleCheckbox(
    ev: // @ts-expect-error -- TODO fix later
    React.ChangeEvent<HTMLInputElement>,
  ) {
    loopRef.current = ev.target.checked;
  }

  function handleStop() {
    for (const host of getRootAccessServers(ns)) {
      ns.killall(host, true);
    }
    setTargets([]);
  }

  function handleNukeAll() {
    setNuked(Array.from(nukeAll(ns)));
    refresh();
  }

  async function handleActionResult(
    host: string,
    action: "hack" | "grow" | "weaken",
    result: false | undefined | { sleepTime: number },
  ) {
    if (!result) return false;
    const { sleepTime } = result;
    const startTime = Date.now();
    const endTime = startTime + sleepTime;
    setTargets((prev) => [...prev, { host, action, startTime, endTime }]);
    await ns.asleep(sleepTime);
    setTargets((prev) => prev.filter((target) => target.host !== host));
    return true;
  }

  async function handleHack(server: string) {
    while ((await handleActionResult(server, "hack", hackTarget(ns, server))) && loopRef.current);
  }

  async function handleGrow(server: string) {
    while ((await handleActionResult(server, "grow", growTarget(ns, server))) && loopRef.current);
  }

  async function handleWeaken(server: string) {
    while ((await handleActionResult(server, "weaken", weakenTarget(ns, server))) && loopRef.current);
  }

  function progress(value: number, max: number) {
    return <progress style={{ width: "40px" }} value={value} max={max} />;
  }
  function formatMoney(value: number) {
    return "$" + ns.formatNumber(value);
  }
  function formatThread(value: number) {
    return ns.formatNumber(value, 0);
  }
  function formatTime(value: number) {
    return Math.floor(value / 1000) + "s";
  }
  function formatRam(value: number) {
    return ns.formatRam(value, 0);
  }
  function formatBoolean(value: boolean) {
    return value ? "yes" : "no";
  }
  function formatSec(value: number) {
    return ns.formatNumber(value, 2);
  }
  function bucket(value: number) {
    return Math.floor(Math.log(value));
  }
}

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");
  ns.tail();
  ns.resizeTail(1200, 400);
  ns.clearLog();

  // ns.printRaw(<Dashboard ns={ns} />);
  render(ns, <Dashboard ns={ns} />);

  while (true) await ns.asleep(10_000);
}
