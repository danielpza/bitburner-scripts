export function getSchedule(tasks, getTime, waitTime = 0) {
  const withDuration = tasks.map((t) => [t, getTime(t)]);
  let goal = 0;
  const withStartTime = withDuration.map(([t, time]) => {
    const startTime = Math.max(goal - time, 0);
    goal = Math.max(goal, time) + waitTime;
    return [t, startTime];
  });
  return { schedule: withStartTime, totalTime: goal };
}
