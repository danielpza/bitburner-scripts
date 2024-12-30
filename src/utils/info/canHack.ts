export function canHack(ns: Bitburner.NS, host: string) {
  const playerHackLevel = ns.getHackingLevel();
  const hackLevel = ns.getServerRequiredHackingLevel(host);

  return hackLevel < playerHackLevel;
}
