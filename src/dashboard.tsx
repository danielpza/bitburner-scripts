import Table from "./components/Table";
import { useForceRender } from "./hooks/useForceRender";
import { useInterval } from "./hooks/useInterval";
import { render } from "./utils/render";

import { growTarget } from "./grow";
import { hackTarget } from "./hack";
import { weakenTarget } from "./weaken";
import { getClusterLoad } from "./utils/getClusterLoad";
import { getRootAccessServers } from "./utils/getRootAccessServers";
import { canEasyHack } from "./utils/info/canEasyHack";
import { clusterExec } from "./utils/clusterExec";
import { Jobs } from "./utils/constants";
import { getClusterFreeThreads } from "./utils/getClusterFreeThreads";
import { getOwnServers } from "./utils/getOwnServers";

interface Task {
  host: string;
  action: string;
  startTime: number;
  endTime: number;
  abortController: AbortController;
}

function Dashboard({ ns }: { ns: Bitburner.NS }) {
  const refresh = useForceRender();
  const [targets, setTargets] = React.useState<Task[]>([]);
  const loopRef = React.useRef(true);
  const load = getClusterLoad(ns);
  const [shareTask, setShareTask] = React.useState<Task | null>(null);

  useInterval(() => {
    refresh();
    const [target] = targets;
    if (target) {
      ns.setTitle(`Dashboard (${target.action} ${target.host} ${formatTime(target.endTime - Date.now())})`);
    } else {
      ns.setTitle("Dashboard");
    }
  }, 1000);

  let servers = getRootAccessServers(ns).filter((server) => {
    if (server.startsWith("purchased_server_")) return false;
    if (server === "home") return false;
    if (ns.getServerMoneyAvailable(server) === 0) return false;
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
      {shareTask ? (
        <label>
          sharing {progress(Date.now() - shareTask.startTime, shareTask.endTime - shareTask.startTime)}
          <button onClick={() => handleCancelShare()}>X</button>
        </label>
      ) : (
        <button onClick={() => handleShare()}>Share</button>
      )}
      <label>
        <input type="checkbox" defaultChecked={loopRef.current} onChange={handleCheckbox} />
        Loop
      </label>{" "}
      <label>
        Load: ({load.total - load.free}/{load.total}) {progress(load.total - load.free, load.total)}
      </label>
      <br />
      <Table
        columns={[
          { label: "Server", getValue: (host) => host, formatter: (value) => value, align: "left" },
          {
            label: "Mny",
            getValue: (host) => [ns.getServerMoneyAvailable(host), ns.getServerMaxMoney(host)],
            formatter: ([money, maxMoney]) => (
              <>
                {color(formatMoney(money), money === 0 ? "red" : money === maxMoney ? "green" : "yellow")}/
                {formatMoney(maxMoney)}
              </>
            ),
          },
          // { label: "HckT", getValue: (host) => ns.getHackTime(host), formatter: formatTime },
          // { label: "GrwT", getValue: (host) => ns.getGrowTime(host), formatter: formatTime },
          { label: "WknT", getValue: (host) => ns.getWeakenTime(host), formatter: formatTime },
          {
            label: "Sec",
            getValue: (host) => [ns.getServerSecurityLevel(host), ns.getServerMinSecurityLevel(host)],
            formatter: ([current, min]) => (
              <>
                {color(formatSec(current), current === min ? "green" : "yellow")}/{formatSec(min)}
              </>
            ),
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
                    <button onClick={() => handleCancel(host)}>X</button>
                  </>
                );
              }

              const money = ns.getServerMoneyAvailable(host);
              const moneyFull = money === ns.getServerMaxMoney(host) && money > 0;
              const secMin = ns.getServerSecurityLevel(host) === ns.getServerMinSecurityLevel(host);
              const easyHack = canEasyHack(ns, host);

              return (
                <div>
                  <button onClick={() => handleAuto(host)}>A</button>
                  <button
                    style={{ color: easyHack && moneyFull && secMin ? "green" : "red" }}
                    onClick={() => handleHack(host)}
                  >
                    H
                  </button>
                  <button
                    style={{ color: !moneyFull && money > 0 && secMin && easyHack ? "green" : "red" }}
                    onClick={() => handleGrow(host)}
                  >
                    G
                  </button>
                  <button style={{ color: easyHack && !secMin ? "green" : "red" }} onClick={() => handleWeaken(host)}>
                    W
                  </button>
                </div>
              );
            },
            align: "left",
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
    for (const host of getRootAccessServers(ns))
      for (const process of ns.ps(host)) if (ns.pid !== process.pid) ns.kill(process.pid);
    for (const target of targets) {
      target.abortController.abort();
    }
    setTargets([]);
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
    const abortController = new AbortController();
    setTargets((prev) => [...prev, { host, action, startTime, endTime, abortController }]);
    await ns.asleep(sleepTime);
    if (abortController.signal.aborted) return false;
    setTargets((prev) => prev.filter((target) => target.host !== host));
    return true;
  }

  function handleCancel(server: string) {
    const target = targets.find((target) => target.host === server);
    if (!target) return;
    for (const host of getRootAccessServers(ns))
      for (const process of ns.ps(host)) if (process.args.includes(server)) ns.kill(process.pid);
    target.abortController.abort();
    setTargets((prev) => prev.filter((target) => target.host !== server));
  }

  async function handleAuto(server: string) {
    do {
      const fullMoney = ns.getServerMoneyAvailable(server) === ns.getServerMaxMoney(server);
      const minSec = ns.getServerSecurityLevel(server) === ns.getServerMinSecurityLevel(server);
      if (!minSec) await handleActionResult(server, "weaken", weakenTarget(ns, server));
      else if (!fullMoney) await handleActionResult(server, "grow", growTarget(ns, server));
      else await handleActionResult(server, "hack", hackTarget(ns, server));
    } while (loopRef.current && (await ns.asleep(50)));
  }

  async function handleHack(server: string) {
    while (
      (await handleActionResult(server, "hack", hackTarget(ns, server))) &&
      loopRef.current &&
      (await ns.asleep(50))
    );
  }

  async function handleGrow(server: string) {
    while (
      (await handleActionResult(server, "grow", growTarget(ns, server))) &&
      loopRef.current &&
      (await ns.asleep(50))
    );
  }

  async function handleWeaken(server: string) {
    while (
      (await handleActionResult(server, "weaken", weakenTarget(ns, server))) &&
      loopRef.current &&
      (await ns.asleep(50))
    );
  }

  async function handleShare() {
    const cluster = getOwnServers(ns);
    const abortController = new AbortController();
    clusterExec(
      ns,
      cluster,
      Jobs.Share(getClusterFreeThreads(ns, cluster, ns.getScriptRam(Jobs.Share.script)), { loop: true }),
      { signal: abortController.signal },
    );
    const sleepTime = 10_000;
    setShareTask({
      host: "cluster",
      action: "share",
      startTime: Date.now(),
      endTime: Date.now() + sleepTime,
      abortController,
    });
    abortController.signal.addEventListener("abort", () => setShareTask(null));
  }

  function handleCancelShare() {
    shareTask?.abortController.abort();
  }

  function progress(value: number, max: number) {
    return <progress style={{ width: "40px" }} value={value} max={max} />;
  }
  function formatMoney(value: number) {
    return "$" + ns.formatNumber(value, 0);
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
  function color(value: any, color: string) {
    return <span style={{ color }}>{value}</span>;
  }
  function bucket(value: number) {
    return Math.floor(Math.log(value));
  }
}

export async function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");
  ns.tail();
  ns.resizeTail(1200, 400);

  render(ns, <Dashboard ns={ns} />);

  while (await ns.asleep(10_000));
}
