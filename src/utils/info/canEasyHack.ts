import { HACK_SKILL_THRESHOLD } from "../constants";

export function canEasyHack(ns: Bitburner.NS, host: string) {
  const playerHackLevel = ns.getHackingLevel();
  const hackLevel = ns.getServerRequiredHackingLevel(host);

  return hackLevel < playerHackLevel / HACK_SKILL_THRESHOLD;
}
