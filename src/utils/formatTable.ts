type Column<T> = {
  header: keyof T;
  format?: (value: any) => string;
  align?: "left" | "right";
  hide?: boolean;
};

export function formatTable<T>(rows: T[], columns: Column<T>[]) {
  let result = "";

  columns = columns.filter((column) => !column.hide);

  let paddings = Array.from({ length: columns.length }, () => 0);
  let aligns = Array.from(
    { length: columns.length },
    (_v, i) => columns[i].align ?? "right",
  );

  const allRows = [
    columns.map((column) => column.header),
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
