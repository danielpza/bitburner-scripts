/**
 * Returns a list of all servers available in the game
 *
 * @example
 *   const allServers = scanAll(ns);
 */
export function scanAll(
  ns: Bitburner.NS,
  target = ns.getHostname(),
  visited = new Set()
): string[] {
  visited.add(target);

  return ns
    .scan(target)
    .filter((child) => !visited.has(child))
    .flatMap((child) => [child, ...scanAll(ns, child, visited)]);
}

export function trace(
  ns: Bitburner.NS,
  target: string,
  host = ns.getHostname(),
  visited = new Set<string>()
): string[] | null {
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

type HeaderValue = number | string | null;
export interface HeaderInfo<
  T extends Record<K, HeaderValue> = Record<
    string | number | symbol,
    HeaderValue
  >,
  K extends string | number | symbol = keyof T
> {
  name: string;
  value?: (v: T) => HeaderValue;
  format?: (v: HeaderValue) => string;
}

export function formatTable<
  T extends Record<K, HeaderValue>,
  K extends string | number | symbol
>(
  headers: (K | HeaderInfo<T, K>)[],
  rows: T[],
  { noHeader = false } = {}
): string {
  const defaultFormat = (v: HeaderValue) => v?.toString() ?? "N/A";

  const parsed = headers.map((header) =>
    typeof header === "string" ? { name: header } : header
  ) as HeaderInfo[];

  const headerRow = _.map(parsed, "name");

  const parsedRows = rows.map((row) =>
    parsed.map(({ name, format = defaultFormat, value = (row) => row[name] }) =>
      format(value(row))
    )
  );

  const actualRows = noHeader ? parsedRows : [headerRow, ...parsedRows];

  if (!actualRows.length) return "";

  const paddings = actualRows[0].map((_, i) =>
    actualRows.reduce((acc, v) => Math.max(v[i].length, acc), 0)
  );

  return actualRows
    .map((subvalues) =>
      subvalues.map((v, i) => v.padStart(paddings[i])).join(" ")
    )
    .join("\n");
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  notation: "compact",
  compactDisplay: "short",
});

const floatFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatMoney = (v: unknown) => moneyFormatter.format(Number(v));

export const formatFloat = (v: unknown) => floatFormatter.format(Number(v));

export const formatInteger = (v: unknown) => integerFormatter.format(Number(v));

export const formatRam = (v: unknown) => `${Number(v)}G`;

const sec = 1000;
const min = 60 * sec;
export const formatTime = (v: unknown) => {
  return `${Math.floor(Number(v) / min)}m${Math.floor(
    (Number(v) % min) / sec
  )}s`;
};

export const formatPercent = (v: unknown) => `${formatFloat(Number(v) * 100)}%`;

export function readJSON<T>(ns: Bitburner.NS, file: string): T | undefined {
  const content = ns.read(file);
  if (content === "") return undefined;
  return JSON.parse(content) as T;
}

export function writeJSON(
  ns: Bitburner.NS,
  file: string,
  content: unknown
): Promise<void> {
  return ns.write(file, JSON.stringify(content), "w");
}
