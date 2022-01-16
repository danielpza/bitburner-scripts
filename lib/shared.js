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
export function formatTable(headers, rows, { noHeader = false } = {}) {
  const defaultFormat = (v) => v?.toString() ?? "N/A";
  const parsed = headers.map((header) => typeof header === "string" ? { name: header } : header);
  const headerRow = _.map(parsed, "name");
  const parsedRows = rows.map((row) => parsed.map(({ name, format = defaultFormat, value = (row2) => row2[name] }) => format(value(row))));
  const actualRows = noHeader ? parsedRows : [headerRow, ...parsedRows];
  if (!actualRows.length)
    return "";
  const paddings = actualRows[0].map((_2, i) => actualRows.reduce((acc, v) => Math.max(v[i].length, acc), 0));
  return actualRows.map((subvalues) => subvalues.map((v, i) => v.padStart(paddings[i])).join(" ")).join("\n");
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
export const formatMoney = (v) => moneyFormatter.format(Number(v));
export const formatFloat = (v) => floatFormatter.format(Number(v));
export const formatInteger = (v) => integerFormatter.format(Number(v));
export const formatRam = (v) => `${Number(v)}G`;
const sec = 1e3;
const min = 60 * sec;
export const formatTime = (v) => {
  return `${Math.floor(Number(v) / min)}m${Math.floor(Number(v) % min / sec)}s`;
};
export const formatPercent = (v) => `${formatFloat(Number(v) * 100)}%`;
