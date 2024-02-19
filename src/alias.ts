import { trace } from "./utils/trace.ts";

export function main(ns: Bitburner.NS) {
  // https://steamcommunity.com/sharedfiles/filedetails/?id=2698422170

  const alias = (name: string, value: string) => `alias ${name.replaceAll(".", "")}="${value}"`;

  const commands = (commands: string[]) => commands.join(";");

  const cconnect = (target: string) =>
    "home; " +
    trace(ns, target)
      ?.map((p) => `connect ${p}`)
      .join("; ");

  const buyCommand = (program: string) => `buy ${program}`;

  ns.tprint(
    "\n" +
      [
        "unalias --all",
        alias("i", "./info.js"),
        alias("a", "./alias.js"),
        ...["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "The-Cave"].map((target) =>
          alias(target, cconnect(target)),
        ),
        alias(
          "b",
          commands([
            ...["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"].map(buyCommand),
            "buy -l",
          ]),
        ),
      ].join(";\n"),
  );
}
