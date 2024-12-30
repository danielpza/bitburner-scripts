function Table<T>(props: {
  columns: {
    label: string;
    align?: "left" | "right";
    getValue: (value: T) => any;
    formatter: (value: any, row: T) => any;
  }[];
  data: T[];
}) {
  return (
    <table>
      <thead>
        <tr>
          {props.columns.map((column) => (
            <th style={{ textAlign: column.align || "left" }}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data.map((row) => (
          <tr>
            {props.columns.map((column) => (
              <td style={{ textAlign: column.align || "left" }}>{column.formatter(column.getValue(row), row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
