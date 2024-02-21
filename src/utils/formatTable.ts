type Column<T> = {
  header: keyof T;
  label?: string;
  format?: (value: any) => string;
  align?: "left" | "right";
  hide?: boolean;
  afterFormat?: (str: string, val: any, row: T) => string;
};

export function formatTable<T>(rows: T[], columns: Column<T>[]) {
  let result = "";

  columns = columns.filter((column) => !column.hide);

  let paddings = Array.from({ length: columns.length }, () => 0);
  let aligns = Array.from({ length: columns.length }, (_v, i) => columns[i].align ?? "right");

  const allRows = [
    columns.map((column) => column.label ?? column.header),
    ...rows.map((row) =>
      columns.map((column) => {
        let value = _.get(row, column.header);
        return column.format?.(value) ?? String(value);
      }),
    ),
  ];

  for (const [_i, row] of allRows.entries()) {
    for (const [j, value] of row.entries()) {
      paddings[j] = Math.max(paddings[j], String(value).length);
      // if (i > 0 && typeof value === "number") aligns[j] = "right";
    }
  }

  for (const [i, row] of allRows.entries()) {
    for (const [j, value] of row.entries()) {
      const afterFormat = columns[j].afterFormat;
      const padding = paddings[j];

      const withPadding = aligns[j] === "left" ? String(value).padEnd(padding) : String(value).padStart(padding);
      const withExtraFormat = i > 0 ? afterFormat?.(withPadding, value, row as T) ?? withPadding : withPadding;

      result += withExtraFormat + " ";
    }
    result += "\n";
  }

  return result;
}
