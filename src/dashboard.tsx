import Table from "./components/Table";
import { useForceRender } from "./hooks/useForceRender";
import { useInterval } from "./hooks/useInterval";
import { Jobs } from "./utils/constants";
import { getFreeThreads } from "./utils/getFreeThreads";
import { render } from "./utils/render";
import { scanAll } from "./utils/scanAll";

import { growTarget } from "./grow";
import { hackTarget } from "./hack";
import { nukeAll } from "./nuke-all";
import { weakenTarget } from "./weaken";

function Dashboard({ ns }: { ns: Bitburner.NS }) {
  const [nuked, setNuked] = React.useState<string[]>([]);
  const hackRam = ns.getScriptRam(Jobs.Hack.script);
  const refresh = useForceRender();
  const [target, setTarget] = React.useState<null | {
    host: string;
    action: "hack" | "grow" | "weaken";
    startTime: number;
    endTime: number;
  }>(null);
  const loopRef = React.useRef(false);

  useInterval(refresh, 1000);

  const servers = [
    // "home",
    ...scanAll(ns),
  ]
    .filter((server) => ns.hasRootAccess(server))
    .slice(0, 10);

  return (
    <>
      <button onClick={handleStop}>Stop</button>
      <button onClick={handleNukeAll}>Nuke</button>
      <label>
        Loop
        <input type="checkbox" onChange={handleCheckbox} />
      </label>
      {nuked.length ? "Nuked: " + nuked.join(", ") : ""}
      <br />
      {target && (
        <div>
          {target.host} {target.action} {formatTime(target.endTime - Date.now())}{" "}
          {progress(Date.now() - target.startTime, target.endTime - target.startTime)}
        </div>
      )}
      <Table
        columns={[
          { label: "Server", getValue: (host) => host, formatter: (value) => value },
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
          { label: "Max RAM", getValue: (host) => ns.getServerMaxRam(host), formatter: formatRam },
          { label: "Threads", getValue: (host) => getFreeThreads(ns, host, hackRam), formatter: formatThread },
          {
            label: "Load",
            getValue: (host) => ns.getServerUsedRam(host),
            formatter: (value, host) => progress(value, ns.getServerMaxRam(host)),
          },
          {
            label: "Actions",
            getValue: (host) => host,
            formatter: (host) => (
              <div>
                <button onClick={() => handleHack(host)}>H</button>
                <button onClick={() => handleGrow(host)}>G</button>
                <button onClick={() => handleWeaken(host)}>W</button>
              </div>
            ),
          },
        ]}
        data={servers}
      />
    </>
  );

  function handleCheckbox(ev: React.ChangeEvent<HTMLInputElement>) {
    loopRef.current = ev.target.checked;
  }

  function handleStop() {
    for (const host of servers) {
      ns.killall(host, true);
    }
    setTarget(null);
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
    setTarget({ host, action, startTime, endTime });
    await ns.asleep(sleepTime);
    return true;
  }

  async function handleHack(server: string) {
    while ((await handleActionResult(server, "hack", hackTarget(ns, server))) && loopRef.current);
    setTarget(null);
  }

  async function handleGrow(server: string) {
    while ((await handleActionResult(server, "grow", growTarget(ns, server))) && loopRef.current);
    setTarget(null);
  }

  async function handleWeaken(server: string) {
    while ((await handleActionResult(server, "weaken", weakenTarget(ns, server))) && loopRef.current);
    setTarget(null);
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
