/** Will setup hooks to cleanup pending running processes
 * @example
 * const cleanup = new ProcessCleanup();
 * cleanup.setup(ns);
 * cleanup.add([1, 2, 3]);
 * cleanup.remove([2]);
 */
export class ProcessCleanup {
  #pids = new Set<number>();

  setup(ns: Bitburner.NS) {
    ns.atExit(() => {
      for (const pid of this.#pids) {
        ns.kill(pid);
      }
    });
  }

  add(pids: number[]) {
    for (const pid of pids) {
      this.#pids.add(pid);
    }
  }

  remove(pids: number[]) {
    for (const pid of pids) {
      this.#pids.delete(pid);
    }
  }
}
