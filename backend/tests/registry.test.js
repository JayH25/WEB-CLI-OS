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

  test("help includes pwd, ls, cd, mkdir, and touch", () => {
    const result = executeCommand("help");

    expect(result.output).toContain("pwd");
    expect(result.output).toContain("ls");
    expect(result.output).toContain("cd");
    expect(result.output).toContain("mkdir");
    expect(result.output).toContain("touch");
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

  describe("mkdir command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-mkdir-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("creates a single directory", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("mkdir", {
        args: ["new_folder"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "new_folder"))).toBe(true);
      expect(
        fs.statSync(path.join(testBaseDir, "new_folder")).isDirectory()
      ).toBe(true);
    });

    test("returns error if directory already exists without -p", () => {
      process.chdir(testBaseDir);
      fs.mkdirSync(path.join(testBaseDir, "existing_folder"));

      const result = executeCommand("mkdir", {
        args: ["existing_folder"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "mkdir: cannot create directory 'existing_folder': File exists",
      });
    });

    test("creates nested directories with -p", () => {
      process.chdir(testBaseDir);
      const nestedPath = path.join("a", "b", "c");
      const result = executeCommand("mkdir", {
        args: [nestedPath],
        flags: ["-p"],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, nestedPath))).toBe(true);
      expect(
        fs.statSync(path.join(testBaseDir, nestedPath)).isDirectory()
      ).toBe(true);
    });

    test("succeeds silently if directory already exists with -p", () => {
      process.chdir(testBaseDir);
      const dirPath = path.join(testBaseDir, "already_exists");
      fs.mkdirSync(dirPath);

      const result = executeCommand("mkdir", {
        args: ["already_exists"],
        flags: ["-p"],
      });

      expect(result).toEqual({ output: "", error: null });
    });

    test("returns error when parent directory does not exist without -p", () => {
      process.chdir(testBaseDir);
      const nestedPath = path.join("nonexistent_parent", "child");
      const result = executeCommand("mkdir", { args: [nestedPath], flags: [] });

      expect(result).toEqual({
        output: null,
        error: `mkdir: cannot create directory '${nestedPath}': No such file or directory`,
      });
    });

    test("returns error when missing operand", () => {
      const result = executeCommand("mkdir", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "mkdir: missing operand",
      });
    });

    test("creates multiple directories in one command", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("mkdir", {
        args: ["dir1", "dir2", "dir3"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "dir1"))).toBe(true);
      expect(fs.existsSync(path.join(testBaseDir, "dir2"))).toBe(true);
      expect(fs.existsSync(path.join(testBaseDir, "dir3"))).toBe(true);
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("mkdir", {
        args: ["test_dir"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "mkdir: invalid option -- 'z'",
      });
    });

    test("mkdir works seamlessly with ls and cd", () => {
      process.chdir(testBaseDir);

      executeCommand("mkdir", { args: ["my_app"], flags: [] });
      expect(executeCommand("ls").output).toContain("my_app");

      executeCommand("cd", { args: ["my_app"], flags: [] });
      expect(executeCommand("pwd").output).toBe(
        path.join(testBaseDir, "my_app")
      );

      executeCommand("mkdir", {
        args: [path.join("src", "components")],
        flags: ["-p"],
      });
      expect(executeCommand("ls").output).toContain("src");
    });
  });

  describe("touch command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-touch-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("creates an empty file when it does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("touch", {
        args: ["new_file.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      const filePath = path.join(testBaseDir, "new_file.txt");
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.statSync(filePath).isFile()).toBe(true);
      expect(fs.statSync(filePath).size).toBe(0);
    });

    test("updates timestamp of existing file while preserving content", () => {
      process.chdir(testBaseDir);
      const filePath = path.join(testBaseDir, "existing.txt");
      fs.writeFileSync(filePath, "persisted content");

      const pastTime = new Date(Date.now() - 60000);
      fs.utimesSync(filePath, pastTime, pastTime);
      const initialMtime = fs.statSync(filePath).mtimeMs;

      const result = executeCommand("touch", {
        args: ["existing.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.readFileSync(filePath, "utf-8")).toBe("persisted content");
      expect(fs.statSync(filePath).mtimeMs).toBeGreaterThan(initialMtime);
    });

    test("updates timestamp of existing directory", () => {
      process.chdir(testBaseDir);
      const dirPath = path.join(testBaseDir, "target_dir");
      fs.mkdirSync(dirPath);

      const pastTime = new Date(Date.now() - 60000);
      fs.utimesSync(dirPath, pastTime, pastTime);
      const initialMtime = fs.statSync(dirPath).mtimeMs;

      const result = executeCommand("touch", {
        args: ["target_dir"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.statSync(dirPath).mtimeMs).toBeGreaterThan(initialMtime);
    });

    test("creates multiple empty files in one command", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("touch", {
        args: ["file1.txt", "file2.txt", "file3.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "file1.txt"))).toBe(true);
      expect(fs.existsSync(path.join(testBaseDir, "file2.txt"))).toBe(true);
      expect(fs.existsSync(path.join(testBaseDir, "file3.txt"))).toBe(true);
    });

    test("-c flag does not create file if it does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("touch", {
        args: ["phantom.txt"],
        flags: ["-c"],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "phantom.txt"))).toBe(false);
    });

    test("-c flag updates timestamp if file already exists", () => {
      process.chdir(testBaseDir);
      const filePath = path.join(testBaseDir, "exists.txt");
      fs.writeFileSync(filePath, "content");
      const pastTime = new Date(Date.now() - 60000);
      fs.utimesSync(filePath, pastTime, pastTime);
      const initialMtime = fs.statSync(filePath).mtimeMs;

      const result = executeCommand("touch", {
        args: ["exists.txt"],
        flags: ["-c"],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.statSync(filePath).mtimeMs).toBeGreaterThan(initialMtime);
    });

    test("returns error when parent directory does not exist", () => {
      process.chdir(testBaseDir);
      const target = path.join("no_parent", "file.txt");
      const result = executeCommand("touch", {
        args: [target],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: `touch: cannot touch '${target}': No such file or directory`,
      });
    });

    test("returns error when missing file operand", () => {
      const result = executeCommand("touch", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "touch: missing file operand",
      });
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("touch", {
        args: ["test.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "touch: invalid option -- 'z'",
      });
    });

    test("touch works seamlessly with ls long listing", () => {
      process.chdir(testBaseDir);

      executeCommand("touch", { args: ["doc.md"], flags: [] });
      const lsResult = executeCommand("ls", { args: [], flags: ["-l"] });

      expect(lsResult.error).toBeNull();
      expect(lsResult.output).toContain("doc.md");
      expect(lsResult.output).toContain("file\t0");
    });
  });
});
