/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { getSchedule, getOptimalSchedule, createLoop } from "./schedule";

describe("getSchedule", () => {
  test.each([
    [[1, 2, 3], [0, 0, 0], 0],
    [[3, 2, 1], [0, 1, 2], 0],
    [[1, 2, 1], [0, 0, 1], 0],
    [[1, 2, 3], [0, 0, 0], 1],
    [[3, 2, 1], [0, 2, 4], 1],
  ])("test %#", ((input: number[], output: number[], waitTime: number) => {
    expect(getSchedule(input, (v) => v, waitTime).schedule).toStrictEqual(
      input.map((v, i) => [v, output[i]])
    );
  }) as any);
});

describe("getOptimalSchedule", () => {
  test.each([
    [[1, 2, 3], [2, 1, 0], 0],
    [[3, 2, 1], [0, 1, 2], 0],
    [[1, 2, 1], [1, 0, 1], 0],
    [[1, 2, 3], [0, 0, 0], 1],
    [[3, 2, 1], [0, 2, 4], 1],
    [[1, 8, 10], [7, 1, 0], 1],
  ])("test %#", ((input: number[], output: number[], waitTime: number) => {
    expect(
      getOptimalSchedule(input, (v) => v, waitTime).schedule
    ).toStrictEqual(input.map((v, i) => [v, output[i]]));
  }) as any);
});

test.only("createLoop", () => {
  console.log(
    createLoop(
      [
        {
          taskTime: 8,
          tasks: Array.from({ length: 10 }, () => "grow"),
        },
        {
          taskTime: 10,
          tasks: Array.from({ length: 20 }, () => "weaken"),
        },
      ],
      1.5
    )
  );
});
