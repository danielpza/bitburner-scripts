import { type ReactNode } from "../../NetScriptDefinitions.js";

export const BUTTON_CLASS = document.querySelector(
  ".MuiButtonBase-root.MuiButton-root.MuiButton-text.MuiButton-textPrimary.MuiButton-sizeMedium.MuiButton-textSizeMedium.MuiButton-root.MuiButton-text.MuiButton-textPrimary.MuiButton-sizeMedium.MuiButton-textSizeMedium",
)?.className;

async function keepAlive(ns: Bitburner.NS) {
  while (true) {
    await ns.asleep(10000000);
  }
}

/**
 @example
 * await setupReact(ns, <>Hello World</>);
 */
export function setupReact(ns: Bitburner.NS, node: ReactNode) {
  ns.disableLog("ALL");
  ns.tail();
  ns.clearLog();
  ns.printRaw(node);
  return keepAlive(ns);
}