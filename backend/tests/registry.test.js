/* eslint-env jest */

const { executeCommand } = require("../commands/registry");

describe("Command Registry", () => {
  test("executes pwd and returns the current working directory", () => {
    const result = executeCommand("pwd");

    expect(result).toEqual({
      output: process.cwd(),
      error: null,
    });
  });

  test("help includes pwd", () => {
    const result = executeCommand("help");

    expect(result.output).toContain("pwd");
  });
});
