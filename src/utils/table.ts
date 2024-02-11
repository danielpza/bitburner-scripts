type Column<T> = {
  header: string;
  getValue: (row: string) => T;
  format?: (value: T) => string;
  align?: "left" | "right";
};
export function table(rows: string[], columns: Column<any>[]) {
  let result = "";

  let paddings = Array.from({ length: columns.length }, () => 0);
  let aligns = Array.from(
    { length: columns.length },
    (_v, i) => columns[i].align ?? "right",
  );

  const allRows = [
    columns.map((column) => column.header),
    ...rows.map((row) =>
      columns.map((column) => {
        let value = column.getValue(row);
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

  for (const row of allRows) {
    for (const [i, value] of row.entries()) {
      if (aligns[i] === "left") {
        result += String(value).padEnd(paddings[i]);
      } else {
        result += String(value).padStart(paddings[i]);
      }
      result += " ";
    }
    result += "\n";
  }

  return result;
}