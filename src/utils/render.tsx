function Wrapper({ ns, children }: { ns: Bitburner.NS; children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(true);
  React.useEffect(() => {
    ns.atExit(() => setEnabled(false));
  }, []);
  if (!enabled) return null;
  return <>{children}</>;
}

/**
 * @example
 *   function Component() {
 *     // complex state here
 *   }
 *   render(ns, <Component />);
 */
export function render(ns: Bitburner.NS, element: React.ReactNode) {
  ns.clearLog();
  ns.printRaw(<Wrapper ns={ns}>{element}</Wrapper>);
}
