export function useList<
  T extends {
    [K in Key]: string;
  },
  Key extends string = "key",
>(
  keyProperty: Key = "key" as Key,
): [T[], { add: (item: T) => void; remove: (key: string) => void; clear: () => void }] {
  const [list, setList] = React.useState<T[]>([]);
  const add = React.useCallback((item: T) => setList((prev) => [...prev, item]), []);
  const remove = React.useCallback(
    (key: string) => setList((prev) => prev.filter((item) => item[keyProperty] !== key)),
    [],
  );
  const clear = React.useCallback(() => setList([]), []);
  return [list, { add, remove, clear }];
}
