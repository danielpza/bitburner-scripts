import _ from "lodash";

/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "d.ts"],
  globals: { _ },
};
