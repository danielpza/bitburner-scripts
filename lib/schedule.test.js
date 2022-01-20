import { getSchedule } from "./schedule";
test.each([
  [[1, 2, 3], [0, 0, 0], 0],
  [[3, 2, 1], [0, 1, 2], 0],
  [[1, 2, 1], [0, 0, 1], 0],
  [[1, 2, 3], [0, 0, 0], 1],
  [[3, 2, 1], [0, 2, 4], 1]
])("schedule test %#", (input, output, waitTime) => {
  expect(getSchedule(input, (v) => v, waitTime).schedule).toStrictEqual(input.map((v, i) => [v, output[i]]));
});
