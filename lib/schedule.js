export function schedule(tasks, getTime, waitTime = 0) {
  const mapped = tasks.map((t) => [t, getTime(t)]);
  let goal = 0;
  const withTime = mapped.map(([t, time]) => {
    const startTime = Math.max(goal - time, 0);
    goal = Math.max(goal, time) + waitTime;
    return [t, startTime];
  });
  return withTime;
}
