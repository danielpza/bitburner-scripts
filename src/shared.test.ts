import { getSchedule } from "./shared";
import _ from "lodash";

beforeAll(() => {
  // @ts-ignore
  global._ = _;
});

test("getSchedule", () => {
  console.log(getSchedule([400, 500, 600], _.identity));
  console.log(getSchedule([3, 1, 2], _.identity));
  console.log(
    getSchedule(
      _.range(10).map((i) => (i % 2 ? 3100 : 2500)),
      _.identity
    )
  );
});
