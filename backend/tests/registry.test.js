/* eslint-env jest */

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  executeCommand,
  resetPreviousWorkingDirectory,
} = require("../commands/registry");

describe("Command Registry", () => {
  const startingCwd = process.cwd();

  afterAll(() => {
    process.chdir(startingCwd);
  });

  test("executes pwd and returns the current working directory", () => {
    const result = executeCommand("pwd");

    expect(result).toEqual({
      output: process.cwd(),
      error: null,
    });
  });

  test("help includes pwd, ls, and cd", () => {
    const result = executeCommand("help");

    expect(result.output).toContain("pwd");
    expect(result.output).toContain("ls");
    expect(result.output).toContain("cd");
  });

  test("executes ls in a specified directory", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-ls-"));

    try {
      fs.writeFileSync(path.join(tempDir, "visible.txt"), "hello");
      fs.writeFileSync(path.join(tempDir, ".hidden.txt"), "secret");
      fs.mkdirSync(path.join(tempDir, "folder"));

      const result = executeCommand("ls", {
        args: [tempDir],
        flags: [],
      });

      expect(result.error).toBeNull();
      expect(result.output.split("\n")).toEqual(["folder", "visible.txt"]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("executes ls -a and includes hidden entries", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-ls-"));

    try {
      fs.writeFileSync(path.join(tempDir, "visible.txt"), "hello");
      fs.writeFileSync(path.join(tempDir, ".hidden.txt"), "secret");

      const result = executeCommand("ls", {
        args: [tempDir],
        flags: ["-a"],
      });

      expect(result.error).toBeNull();
      expect(result.output.split("\n")).toEqual([
        ".",
        "..",
        ".hidden.txt",
        "visible.txt",
      ]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("executes ls -l with name, type, size, and date columns", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-ls-"));

    try {
      const filePath = path.join(tempDir, "visible.txt");
      fs.writeFileSync(filePath, "hello");

      const result = executeCommand("ls", {
        args: [tempDir],
        flags: ["-l"],
      });

      expect(result.error).toBeNull();

      const [line] = result.output.split("\n");
      const [name, type, size, date] = line.split("\t");

      expect(name).toBe("visible.txt");
      expect(type).toBe("file");
      expect(size).toBe(String(fs.statSync(filePath).size));
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("executes ls -la and combines long format with hidden entries", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-ls-"));

    try {
      fs.writeFileSync(path.join(tempDir, "visible.txt"), "hello");
      fs.writeFileSync(path.join(tempDir, ".hidden.txt"), "secret");

      const result = executeCommand("ls", {
        args: [tempDir],
        flags: ["-la"],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");

      expect(lines).toHaveLength(4);
      expect(lines[0].split("\t")[0]).toBe(".");
      expect(lines[1].split("\t")[0]).toBe("..");
      expect(lines[2].split("\t")[0]).toBe(".hidden.txt");
      expect(lines[3].split("\t")[0]).toBe("visible.txt");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("cd command", () => {
    let testBaseDir;
    let subDirA;
    let subDirB;

    beforeEach(() => {
      resetPreviousWorkingDirectory();
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-cd-"));
      subDirA = path.join(testBaseDir, "subA");
      subDirB = path.join(testBaseDir, "subB");
      fs.mkdirSync(subDirA);
      fs.mkdirSync(subDirB);
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("navigates to absolute path", () => {
      const result = executeCommand("cd", { args: [subDirA], flags: [] });

      expect(result).toEqual({ output: "", error: null });
      expect(process.cwd()).toBe(subDirA);
    });

    test("navigates to relative path", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("cd", { args: ["subA"], flags: [] });

      expect(result).toEqual({ output: "", error: null });
      expect(process.cwd()).toBe(subDirA);
    });

    test("navigates to parent directory with cd ..", () => {
      process.chdir(subDirA);
      const result = executeCommand("cd", { args: [".."], flags: [] });

      expect(result).toEqual({ output: "", error: null });
      expect(process.cwd()).toBe(testBaseDir);
    });

    test("navigates to home directory with cd ~", () => {
      process.chdir(subDirA);
      const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
      const result = executeCommand("cd", { args: ["~"], flags: [] });

      expect(result).toEqual({ output: "", error: null });
      expect(process.cwd()).toBe(home);
    });

    test("navigates to home directory when no arguments are provided", () => {
      process.chdir(subDirA);
      const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
      const result = executeCommand("cd", { args: [], flags: [] });

      expect(result).toEqual({ output: "", error: null });
      expect(process.cwd()).toBe(home);
    });

    test("returns error on cd - when OLDPWD is not set", () => {
      resetPreviousWorkingDirectory();
      const result = executeCommand("cd", { args: ["-"], flags: [] });

      expect(result).toEqual({ output: null, error: "cd: OLDPWD not set" });
    });

    test("navigates to previous directory with cd - and outputs directory path", () => {
      process.chdir(subDirA);
      executeCommand("cd", { args: [subDirB], flags: [] });
      expect(process.cwd()).toBe(subDirB);

      const result = executeCommand("cd", { args: ["-"], flags: [] });

      expect(result).toEqual({ output: subDirA, error: null });
      expect(process.cwd()).toBe(subDirA);
    });

    test("supports cd - when flag parser produces ['-']", () => {
      process.chdir(subDirA);
      executeCommand("cd", { args: [subDirB], flags: [] });

      const result = executeCommand("cd", { args: [], flags: ["-"] });

      expect(result).toEqual({ output: subDirA, error: null });
      expect(process.cwd()).toBe(subDirA);
    });

    test("toggles between directories when cd - is invoked repeatedly", () => {
      process.chdir(subDirA);
      executeCommand("cd", { args: [subDirB], flags: [] });

      const firstBack = executeCommand("cd", { args: ["-"], flags: [] });
      expect(firstBack.output).toBe(subDirA);
      expect(process.cwd()).toBe(subDirA);

      const secondBack = executeCommand("cd", { args: ["-"], flags: [] });
      expect(secondBack.output).toBe(subDirB);
      expect(process.cwd()).toBe(subDirB);
    });

    test("returns error when navigating to nonexistent directory", () => {
      const missing = path.join(testBaseDir, "does-not-exist");
      const result = executeCommand("cd", { args: [missing], flags: [] });

      expect(result).toEqual({
        output: null,
        error: `cd: ${missing}: No such file or directory`,
      });
    });

    test("returns error when navigating to a file", () => {
      const filePath = path.join(testBaseDir, "file.txt");
      fs.writeFileSync(filePath, "test content");
      const result = executeCommand("cd", { args: [filePath], flags: [] });

      expect(result).toEqual({
        output: null,
        error: `cd: ${filePath}: Not a directory`,
      });
    });

    test("returns error when more than one argument is provided", () => {
      const result = executeCommand("cd", {
        args: [subDirA, subDirB],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cd: too many arguments",
      });
    });

    test("returns error when cd - has extra arguments", () => {
      const result = executeCommand("cd", {
        args: [subDirA],
        flags: ["-"],
      });

      expect(result).toEqual({
        output: null,
        error: "cd: too many arguments",
      });
    });

    test("returns error on invalid flag option", () => {
      const result = executeCommand("cd", { args: [subDirA], flags: ["-z"] });

      expect(result).toEqual({
        output: null,
        error: "cd: invalid option -- 'z'",
      });
    });

    test("cd updates pwd and ls results dynamically", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(subDirA, "fileA.txt"), "hello");

      executeCommand("cd", { args: ["subA"], flags: [] });
      expect(executeCommand("pwd").output).toBe(subDirA);
      expect(executeCommand("ls").output).toBe("fileA.txt");

      executeCommand("cd", { args: [".."], flags: [] });
      expect(executeCommand("pwd").output).toBe(testBaseDir);
      expect(executeCommand("ls").output.split("\n")).toContain("subA");
    });
  });
});
