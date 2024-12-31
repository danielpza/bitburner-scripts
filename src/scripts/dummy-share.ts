export async function main(ns: Bitburner.NS) {
  const loop = ns.args.includes("--loop");
  do {
    await ns.share();
  } while (loop);
}
