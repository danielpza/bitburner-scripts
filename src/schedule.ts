export function schedule<T>(
  tasks: T[],
  getTime: (task: T) => number,
  waitTime = 0
) {
  const mapped: [T, number][] = tasks.map((t) => [t, getTime(t)]);

  let goal = 0;

  const withTime: [T, number][] = mapped.map(([t, time]) => {
    const startTime = Math.max(goal - time, 0);
    goal = Math.max(goal, time) + waitTime;
    return [t, startTime];
  });

  return withTime;
}
