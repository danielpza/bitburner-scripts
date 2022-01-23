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

export function getOptimalSchedule<T>(
  tasks: T[],
  getTime: (task: T) => number,
  waitTime = 0
) {
  const withDuration: [T, number][] = tasks.map((t) => [t, getTime(t)]);

  let withStartTime: [T, number][] = withDuration.map(([t, time], i) => {
    return [t, i * waitTime - time];
  });

  const min = _.minBy(withStartTime, "1")?.[1] ?? 0;
  withStartTime = withStartTime.map(([t, time]) => [t, time - min]);

  const biggestTime = _.max(
    withStartTime.map(([, time], i) => withDuration[i][1] + time)
  );

  return { schedule: withStartTime, totalTime: biggestTime };
}

export function createLoop<T>(
  batchesDescription: {
    taskTime: number;
    tasks: T[];
  }[],
  waitTime = 0
) {
  // : [T, number][]
  const singleBatchSchedule = getOptimalSchedule(
    batchesDescription.map((batch) => batch.taskTime),
    (v) => v,
    waitTime
  );
  const loopTime = singleBatchSchedule.totalTime as number;
  const allTasks = _.flatten(
    _.takeWhile(
      _.zip(
        ...batchesDescription.map((batchDescription) =>
          batchDescription.tasks.map((task) => ({
            task,
            time: batchDescription.taskTime,
          }))
        )
      ),
      (v) => _.every(v)
    )
  );
  const scheduled = getOptimalSchedule(
    allTasks,
    (v) => v?.time as number,
    waitTime
  );

  const getFinishTime = (v: typeof scheduled["schedule"][number]) =>
    v[1] + (v[0]?.time as number);

  const firstTaskTime = getFinishTime(scheduled.schedule[0]);

  let tasksLoop = _.takeWhile(
    scheduled.schedule,
    (v) => getFinishTime(v) <= loopTime + firstTaskTime
  );

  if (tasksLoop.length % batchesDescription.length) {
    tasksLoop = tasksLoop.slice(
      0,
      -tasksLoop.length % batchesDescription.length
    );
  }

  const actualLoopTime =
    (_.max(tasksLoop.map((v) => getFinishTime(v))) as number) -
    (_.min(tasksLoop.map((v) => getFinishTime(v))) as number) +
    waitTime;

  const organized: [T, number][] = tasksLoop.map(([t, time]) => [
    t?.task as T,
    time,
  ]);

  return { tasksLoop: organized, loopTime: actualLoopTime };
}
