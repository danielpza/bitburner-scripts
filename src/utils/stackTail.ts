const WIDTH = 200;
const HEIGHT = 62;

export function stackTail(ns: Bitburner.NS, pos?: number, width = WIDTH) {
  ns.disableLog("ALL");
  ns.tail();

  ns.resizeTail(width, HEIGHT);

  if (pos !== undefined) {
    const [ww, _wh] = ns.ui.windowSize();
    ns.moveTail(ww - width - 200, pos * HEIGHT);
  }
}
