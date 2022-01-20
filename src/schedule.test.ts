/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { schedule } from "./schedule";

test.each([
  [[1, 2, 3], [0, 0, 0], 0],
  [[3, 2, 1], [0, 1, 2], 0],
  [[1, 2, 1], [0, 0, 1], 0],
  [[1, 2, 3], [0, 0, 0], 1],
  [[3, 2, 1], [0, 2, 4], 1],
])("schedule test %#", ((
  input: number[],
  output: number[],
  waitTime: number
) => {
  expect(schedule(input, (v) => v, waitTime)).toStrictEqual(
    input.map((v, i) => [v, output[i]])
  );
}) as any);
