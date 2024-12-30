export function useForceRender() {
  const [, updateState] = React.useState<undefined | object>();
  return React.useCallback(() => updateState({}), []);
}
