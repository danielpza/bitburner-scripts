export function scanAll(ns, target = ns.getHostname(), visited = /* @__PURE__ */ new Set()) {
  visited.add(target);
  return ns.scan(target).filter((child) => !visited.has(child)).flatMap((child) => [child, ...scanAll(ns, child, visited)]);
}
export function trace(ns, target, host = ns.getHostname(), visited = /* @__PURE__ */ new Set()) {
  visited.add(host);
  const children = ns.scan(host).filter((child) => !visited.has(child));
  for (const child of children) {
    if (child === target) {
      return [host, target];
    }
    const path = trace(ns, target, child, visited);
    if (path) {
      return [host, ...path];
    }
  }
  return null;
}
export const formatTable = (values) => {
  if (!values.length)
    return "";
  const paddings = values[0].map((_2, i) => values.reduce((acc, v) => Math.max(v[i].length, acc), 0));
  return values.map((subvalues) => subvalues.map((v, i) => v.padStart(paddings[i])).join(" ")).join("\n");
};
export function renderTable(headers, rows, { noHeader = false } = {}) {
  const defaultFormat = (v) => v.toString();
  const parsed = headers.map((header) => typeof header === "string" ? { name: header } : header);
  const headerRow = _.map(parsed, "name");
  const parsedRows = rows.map((row) => parsed.map(({ name, format = defaultFormat, value = (row2) => row2[name] }) => format(value(row))));
  return formatTable(noHeader ? parsedRows : [headerRow, ...parsedRows]);
}
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  notation: "compact",
  compactDisplay: "short"
});
const floatFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const integerFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});
export const formatMoney = (v) => moneyFormatter.format(v);
export const formatFloat = (v) => floatFormatter.format(v);
export const formatInteger = (v) => integerFormatter.format(v);
export const formatRam = (v) => `${v}G`;
const sec = 1e3;
const min = 60 * sec;
export const formatTime = (v) => {
  return `${Math.floor(v / min)}m${Math.floor(v % min / sec)}s`;
};
export const formatPercent = (v) => `${formatFloat(v * 100)}%`;
export const SCHEDULE_WAIT_TIME = 200;
export function getSchedule(tasks, getTime) {
  let mapped = tasks.map((t) => [t, getTime(t)]);
  const biggest = _.maxBy(mapped, "1")?.[1] ?? 0;
  mapped = mapped.slice(0, Math.ceil(biggest / SCHEDULE_WAIT_TIME));
  const extra = mapped.length * SCHEDULE_WAIT_TIME;
  const maxTime = (_.maxBy(mapped, "1")?.[1] ?? 0) + extra;
  const total = mapped.length;
  const withTime = mapped.map(([t, time], i) => [
    t,
    maxTime - (total - i) * SCHEDULE_WAIT_TIME - time
  ]);
  const min2 = _.minBy(withTime, "1")[1];
  const adjusted = withTime.map(([t, time]) => [t, time - min2]);
  return { tasks: adjusted, maxTime: maxTime - min2 - SCHEDULE_WAIT_TIME };
}
export async function schedule(ns, tasks) {
  const { tasks: schduledTasks, maxTime } = getSchedule(tasks, _.iteratee("time"));
  for (const [{ run }, startTime] of schduledTasks) {
    run(startTime);
  }
  await ns.asleep(maxTime);
}
