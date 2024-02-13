/** Will setup hooks to cleanup pending running processes
 * @example
 * const cleanup = new ProcessCleanup();
 * cleanup.setup(ns);
 * cleanup.add([1, 2, 3]);
 * cleanup.remove([2]);
 */
export class ProcessCleanup {
  static #pcleanup: ProcessCleanup | undefined;

  static get(ns: Bitburner.NS) {
    if (!this.#pcleanup) {
      this.#pcleanup = new ProcessCleanup(ns);
    }
    return this.#pcleanup;
  }

  #pids = new Set<number>();
  #ns: Bitburner.NS;

  constructor(ns: Bitburner.NS) {
    this.#ns = ns;
    this.#setup();
  }

  #setup() {
    this.#ns.atExit(() => {
      for (const pid of this.#pids) {
        this.#ns.kill(pid);
      }
    });
  }

  add(pids: number[], timeout?: number) {
    for (const pid of pids) {
      this.#pids.add(pid);
    }
    if (timeout) {
      this.#ns.asleep(timeout).then(() => {
        this.#remove(pids);
      });
    }
  }

  #remove(pids: number[]) {
    for (const pid of pids) {
      this.#pids.delete(pid);
    }
  }
}
