import { setupReact } from "./utils/ui.ts";
import { BUTTON_CLASS } from "./utils/ui-classes.ts";
import { getRootAccessServers } from "./utils/getRootAccessServers.ts";

function Load({ ns }: { ns: Bitburner.NS }) {
  const [load, setLoad] = window.React.useState(0);
  window.React.useEffect(() => {
    (async () => {
      while (true) {
        const cluster = getRootAccessServers(ns);
        const total = cluster.reduce(
          (acc, s) => acc + ns.getServerMaxRam(s),
          0,
        );
        const used = cluster.reduce(
          (acc, s) => acc + ns.getServerUsedRam(s),
          0,
        );
        setLoad(used / total);
        await ns.asleep(1000);
      }
    })();
  }, []);
  return <div>Load: {(load * 100).toFixed(2)}%</div>;
}

function Main({ ns }: { ns: Bitburner.NS }) {
  return (
    <>
      <Load ns={ns} />
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          padding: "8px",
        }}
      >
        <div>hello world</div>
        <div style={{ flex: 1 }} />
        <button
          className={BUTTON_CLASS}
          onClick={() => {
            alert("HELLO WORLD");
          }}
        >
          button
        </button>
      </div>
    </>
  );
}

export async function main(ns: Bitburner.NS) {
  return setupReact(ns, <Main ns={ns} />);
  // ns.tprint("\n", {
  // });
  // ns.tprint(
  //   "\n",
  //   table(
  //     [1, 2, 3],
  //     [
  //       {
  //         header: "Threads",
  //         getValue: (v) => v,
  //       },
  //       {
  //         header: "hackAnalyzeSec",
  //         getValue: (v) => ns.hackAnalyzeSecurity(v, target1),
  //         format: ns.formatNumber,
  //       },
  //       {
  //         header: "growthAnalyzeSec",
  //         getValue: (v) => ns.growthAnalyzeSecurity(v, target1),
  //         format: ns.formatNumber,
  //       },
  //       {
  //         header: "weakenAnalyze",
  //         getValue: (v) => ns.weakenAnalyze(v),
  //         format: ns.formatNumber,
  //       },
  //     ],
  //   ),
  // );

  // ns.tprint(
  //   "\n",
  //   table(
  //     ["n00dles", "foodnstuff", "sigma-cosmetics", "joesguns"],
  //     [
  //       {
  //         header: "Host",
  //         getValue: (v) => v,
  //         align: "left",
  //       },
  //       {
  //         header: "hackAnalyzeSec",
  //         getValue: (v) => ns.hackAnalyzeSecurity(1, v),
  //         format: ns.formatNumber,
  //       },
  //       {
  //         header: "growthAnalyzeSec",
  //         getValue: (v) => ns.growthAnalyzeSecurity(1, v),
  //         format: ns.formatNumber,
  //       },
  //     ],
  //   ),
  // );

  // ns.tprint(
  //   "\n",
  //   table<[string, number]>(
  //     [
  //       ...(Array.from({ length: 6 }, (_, i) => ["n00dles", i + 1]) as [
  //         string,
  //         number,
  //       ][]),
  //       ...(Array.from({ length: 6 }, (_, i) => ["foodnstuff", i + 1]) as [
  //         string,
  //         number,
  //       ][]),
  //       ...(Array.from({ length: 6 }, (_, i) => ["joesguns", i + 1]) as [
  //         string,
  //         number,
  //       ][]),
  //       ...(Array.from({ length: 6 }, (_, i) => ["sigma-cosmetics", i + 1]) as [
  //         string,
  //         number,
  //       ][]),
  //     ],
  //     [
  //       {
  //         header: "Host",
  //         getValue: ([t, tt]) => `${t} ${tt}`,
  //         align: "left",
  //       },
  //       {
  //         header: "hackAnalyze",
  //         getValue: ([h, t]) => ns.hackAnalyze(h) * t,
  //         format: ns.formatNumber,
  //       },
  //       {
  //         header: "1/(1-hackAnalyze)",
  //         getValue: ([h, t]) => 1 / (1 - ns.hackAnalyze(h) * t),
  //         format: ns.formatNumber,
  //       },
  //       {
  //         header: "growthAnalyze",
  //         getValue: ([h, t]) =>
  //           ns.growthAnalyze(h, 1 / (1 - ns.hackAnalyze(h) * t)),
  //         format: ns.formatNumber,
  //       },
  //       {
  //         header: "growth",
  //         getValue: ([h]) => ns.getServerGrowth(h),
  //         format: ns.formatNumber,
  //       },
  //     ],
  //   ),
  // );
}
