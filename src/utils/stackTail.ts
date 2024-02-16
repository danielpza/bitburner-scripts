const WIDTH = 200;
const HEIGHT = 62;

export function stackTail(ns: Bitburner.NS, pos?: number, width = WIDTH) {
  ns.tail();
  ns.resizeTail(width, HEIGHT);
  if (pos !== undefined) {
    ns.moveTail(0, pos * HEIGHT);
  }
}
