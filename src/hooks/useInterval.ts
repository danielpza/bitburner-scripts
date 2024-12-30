export function useInterval(fn: () => void, delay: number) {
  const savedCallback = React.useRef<() => void>(null);
  savedCallback.current = fn;
  React.useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => {
        savedCallback.current?.();
      }, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
