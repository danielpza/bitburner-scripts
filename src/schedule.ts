export function getSchedule<T>(
  tasks: T[],
  getTime: (task: T) => number,
  waitTime = 0
) {
  const withDuration: [T, number][] = tasks.map((t) => [t, getTime(t)]);

  let goal = 0;

  const withStartTime: [T, number][] = withDuration.map(([t, time]) => {
    const startTime = Math.max(goal - time, 0);
    goal = Math.max(goal, time) + waitTime;
    return [t, startTime];
  });

  return { schedule: withStartTime, totalTime: goal - waitTime };
}
