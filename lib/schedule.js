export const SCHEDULE_WAIT_TIME = 200;
export function schedule(tasks, getTime, waitTime = SCHEDULE_WAIT_TIME) {
  const mapped = tasks.map((t) => [t, getTime(t)]);
  const extra = mapped.length * waitTime;
  const maxTime = (_.maxBy(mapped, "1")?.[1] ?? 0) + extra;
  const total = mapped.length;
  const withTime = mapped.map(([t, time], i) => [
    t,
    maxTime - (total - i) * waitTime - time
  ]);
  const min = _.minBy(withTime, "1")?.[1] ?? 0;
  const adjusted = withTime.map(([t, time]) => [t, time - min]);
  return adjusted;
}
