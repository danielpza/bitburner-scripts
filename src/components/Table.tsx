function Table<T>(props: {
  columns: {
    label: string;
    align?: "left" | "right";
    getValue: (value: T) => any;
    formatter?: (value: any, row: T) => any;
  }[];
  data: T[];
}) {
  return (
    <table>
      <thead>
        <tr>
          {props.columns.map((column) => (
            <th style={{ textAlign: column.align || "right" }}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.data.map((row) => (
          <tr>
            {props.columns.map((column) => {
              const value = column.getValue(row);
              return <td style={{ textAlign: column.align || "right" }}>{column.formatter?.(value, row) ?? value}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
