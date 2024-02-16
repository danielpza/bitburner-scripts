import { ShareToggle, SHARE_FILE } from "../utils/constants.ts";
import { stackTail } from "../utils/stackTail.ts";

export function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");
  stackTail(ns, 5);

  const script = ns.getRunningScript();
  if (!script) return;

  let isSharing = (ns.read(SHARE_FILE) || ShareToggle.on) === ShareToggle.on;

  isSharing = !isSharing;

  ns.write(SHARE_FILE, isSharing ? ShareToggle.on : ShareToggle.off, "w");
  ns.setTitle(isSharing ? "sharing" : "not sharing");
}
