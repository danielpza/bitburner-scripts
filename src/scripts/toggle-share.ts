import { Port, ToggleShare } from "../utils/constants.ts";
import { stackTail } from "../utils/stackTail.ts";

export function main(ns: Bitburner.NS) {
  ns.disableLog("ALL");
  stackTail(ns, 5);

  const script = ns.getRunningScript();
  if (!script) return;

  const port = ns.getPortHandle(Port.toggle);
  const isSharing = script.title !== "not sharing";

  while (!port.empty()) port.read();

  port.tryWrite(isSharing ? ToggleShare.off : ToggleShare.on);
  ns.setTitle(isSharing ? "not sharing" : "sharing");
}
