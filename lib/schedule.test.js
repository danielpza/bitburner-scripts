import { schedule } from "./schedule";
it("schedule", () => {
  expect(schedule([1, 2, 3], (v) => v, 0)).toStrictEqual([
    [1, 0],
    [2, 0],
    [3, 0]
  ]);
});
