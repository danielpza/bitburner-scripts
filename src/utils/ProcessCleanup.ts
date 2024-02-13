/**
 * Will setup hooks to cleanup pending running processes
 *
 * @example
 * ProcessCleanup.get(ns).add(pid);
 */
export class ProcessCleanup {
  static #pcleanup = new Map<number, ProcessCleanup>();

  static get(ns: Bitburner.NS) {
    if (!this.#pcleanup.has(ns.pid)) {
      this.#pcleanup.set(ns.pid, new ProcessCleanup(ns));
    }
    return this.#pcleanup.get(ns.pid)!;
  }

  #pids = new Set<number>();
  #ns: Bitburner.NS;

  constructor(ns: Bitburner.NS) {
    this.#ns = ns;
    this.#setup();
  }

  #setup() {
    this.#ns.atExit(() => {
      ProcessCleanup.#pcleanup.delete(this.#ns.pid);
      for (const pid of this.#pids) {
        this.#ns.kill(pid);
      }
    });
  }

  add(pid: number) {
    this.#pids.add(pid);
  }
}
