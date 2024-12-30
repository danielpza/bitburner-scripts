import { growTarget } from "./grow";
import { hackTarget } from "./hack";
import { useForceRender } from "./hooks/useForceRender";
import { useInterval } from "./hooks/useInterval";
import { nukeAll } from "./nuke-all";
import { Jobs } from "./utils/constants";
import { getFreeThreads } from "./utils/getFreeThreads";
import { render } from "./utils/render";
import { scanAll } from "./utils/scanAll";
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
      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Server</th>
            <th style={{ textAlign: "right" }}>Money</th>
            <th style={{ textAlign: "right" }}>Max Money</th>
            <th style={{ textAlign: "right" }}>Hack Time</th>
            <th style={{ textAlign: "right" }}>Grow Time</th>
            <th style={{ textAlign: "right" }}>Weaken Time</th>
            <th style={{ textAlign: "right" }}>Level</th>
            <th style={{ textAlign: "right" }}>Max RAM</th>
            <th style={{ textAlign: "right" }}>Threads</th>
            <th>Load</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((host) => {
            const currentSecurity = ns.getServerSecurityLevel(host);
            const minSecurity = ns.getServerMinSecurityLevel(host);
            const hackLevel = ns.getServerRequiredHackingLevel(host);
            const hackTime = ns.getHackTime(host);
            const growTime = ns.getGrowTime(host);
            const weakenTime = ns.getWeakenTime(host);
            return (
              <tr key={host}>
                <td>{host}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(ns.getServerMoneyAvailable(host))}</td>
                <td style={{ textAlign: "right" }}>{formatMoney(ns.getServerMaxMoney(host))}</td>
                <td style={{ textAlign: "right" }}>{formatTime(hackTime)}</td>
                <td style={{ textAlign: "right" }}>{formatTime(growTime)}</td>
                <td style={{ textAlign: "right" }}>{formatTime(weakenTime)}</td>
                <td style={{ textAlign: "right" }}>
                  {formatSec(currentSecurity)}/{formatSec(minSecurity)}
                </td>
                <td style={{ textAlign: "right" }}>{formatRam(ns.getServerMaxRam(host))}</td>
                <td style={{ textAlign: "right" }}>{getFreeThreads(ns, host, hackRam)}</td>
                <td>{progress(ns.getServerUsedRam(host), ns.getServerMaxRam(host))}</td>
                <td>
                  <button onClick={() => handleHack(host)}>H</button>
                  <button onClick={() => handleGrow(host)}>G</button>
                  <button onClick={() => handleWeaken(host)}>W</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
