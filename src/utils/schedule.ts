export function getOptimalSchedule<T>(
  tasks: T[],
  getTime: (task: T) => number,
  waitTime = 0,
) {
  const withDuration: [T, number][] = tasks.map((t) => [t, getTime(t)]);

  let withStartTime: [T, number][] = withDuration.map(([t, time], i) => {
    return [t, i * waitTime - time];
  });

  const min = _.minBy(withStartTime, "1")?.[1] ?? 0;
  withStartTime = withStartTime.map(([t, time]) => [t, time - min]);

  const biggestTime = _.max(
    withStartTime.map(([, time], i) => withDuration[i][1] + time),
  ) as number;

  return { schedule: withStartTime, totalTime: biggestTime };
}
