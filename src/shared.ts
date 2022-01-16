/**
 * Returns a list of all servers available in the game
 *
 * @example
 *   const allServers = scanAll(ns);
 */
export function scanAll(
  ns: NS,
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
  ns: NS,
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

export const formatTable = (values: string[][]) => {
  if (!values.length) return "";

  const paddings = values[0].map((_, i) =>
    values.reduce((acc, v) => Math.max(v[i].length, acc), 0)
  );

  return values
    .map((subvalues) =>
      subvalues.map((v, i) => v.padStart(paddings[i])).join(" ")
    )
    .join("\n");
};

interface HeaderInfo<T = any> {
  name: string;
  value?: (v: T) => any;
  format?: (v: any) => string;
}

type Header<T = any> = keyof T | HeaderInfo<T>;

export function renderTable<T = any>(
  headers: Header<T>[],
  rows: T[],
  { noHeader = false } = {}
): string {
  const defaultFormat = (v: any) => v.toString();

  const parsed = headers.map((header) =>
    typeof header === "string" ? { name: header } : header
  ) as HeaderInfo[];

  const headerRow = _.map(parsed, "name");

  const parsedRows = rows.map((row) =>
    parsed.map(({ name, format = defaultFormat, value = (row) => row[name] }) =>
      format(value(row))
    )
  );

  return formatTable(noHeader ? parsedRows : [headerRow, ...parsedRows]);
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

export const formatMoney = (v: number) => moneyFormatter.format(v);

export const formatFloat = (v: number) => floatFormatter.format(v);

export const formatInteger = (v: number) => integerFormatter.format(v);

export const formatRam = (v: number) => `${v}G`;

const sec = 1000;
const min = 60 * sec;
export const formatTime = (v: number) => {
  return `${Math.floor(v / min)}m${Math.floor((v % min) / sec)}s`;
};

export const formatPercent = (v: number) => `${formatFloat(v * 100)}%`;
