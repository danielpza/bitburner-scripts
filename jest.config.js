import _ from "lodash";

/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: { _ },
};
