/* eslint-env jest */

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  executeCommand,
  resetPreviousWorkingDirectory,
  getNodeMetadata,
  setNodeMetadata,
  resetNodeMetadata,
  modeToPermissionString,
  permissionStringToMode,
  parseSymbolicMode,
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

  test("help includes pwd, ls, cd, mkdir, touch, cat, rm, cp, mv, find, grep, head, tail, and wc", () => {
    const result = executeCommand("help");

    expect(result.output).toContain("pwd");
    expect(result.output).toContain("ls");
    expect(result.output).toContain("cd");
    expect(result.output).toContain("mkdir");
    expect(result.output).toContain("touch");
    expect(result.output).toContain("cat");
    expect(result.output).toContain("rm");
    expect(result.output).toContain("cp");
    expect(result.output).toContain("mv");
    expect(result.output).toContain("find");
    expect(result.output).toContain("grep");
    expect(result.output).toContain("head");
    expect(result.output).toContain("tail");
    expect(result.output).toContain("wc");
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

  describe("cat command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-cat-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("outputs content of a single file", () => {
      process.chdir(testBaseDir);
      const filePath = path.join(testBaseDir, "hello.txt");
      fs.writeFileSync(filePath, "Hello, world!\n");

      const result = executeCommand("cat", {
        args: ["hello.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: "Hello, world!\n",
        error: null,
      });
    });

    test("concatenates and outputs multiple files", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "part1.txt"), "First part. ");
      fs.writeFileSync(path.join(testBaseDir, "part2.txt"), "Second part.\n");

      const result = executeCommand("cat", {
        args: ["part1.txt", "part2.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: "First part. Second part.\n",
        error: null,
      });
    });

    test("returns empty string when no arguments are provided", () => {
      const result = executeCommand("cat", { args: [], flags: [] });

      expect(result).toEqual({
        output: "",
        error: null,
      });
    });

    test("returns error when target file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("cat", {
        args: ["missing.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cat: missing.txt: No such file or directory",
      });
    });

    test("returns error when target is a directory", () => {
      process.chdir(testBaseDir);
      const dirPath = path.join(testBaseDir, "my_dir");
      fs.mkdirSync(dirPath);

      const result = executeCommand("cat", {
        args: ["my_dir"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cat: my_dir: Is a directory",
      });
    });

    test("numbers output lines when -n flag is passed", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "lines.txt"), "Line 1\nLine 2\n");

      const result = executeCommand("cat", {
        args: ["lines.txt"],
        flags: ["-n"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("     1\tLine 1\n     2\tLine 2\n");
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("cat", {
        args: ["test.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "cat: invalid option -- 'z'",
      });
    });

    test("outputs content from newly touched and populated files", () => {
      process.chdir(testBaseDir);

      executeCommand("touch", { args: ["notes.txt"], flags: [] });
      expect(executeCommand("cat", { args: ["notes.txt"], flags: [] })).toEqual(
        {
          output: "",
          error: null,
        }
      );

      fs.writeFileSync(
        path.join(testBaseDir, "notes.txt"),
        "Updated notes content"
      );
      expect(executeCommand("cat", { args: ["notes.txt"], flags: [] })).toEqual(
        {
          output: "Updated notes content",
          error: null,
        }
      );
    });
  });

  describe("rm command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-rm-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("removes a single file", () => {
      process.chdir(testBaseDir);
      const filePath = path.join(testBaseDir, "to_delete.txt");
      fs.writeFileSync(filePath, "delete me");

      const result = executeCommand("rm", {
        args: ["to_delete.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(filePath)).toBe(false);
    });

    test("returns error when attempting to remove directory without -r", () => {
      process.chdir(testBaseDir);
      const dirPath = path.join(testBaseDir, "folder");
      fs.mkdirSync(dirPath);

      const result = executeCommand("rm", {
        args: ["folder"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "rm: cannot remove 'folder': Is a directory",
      });
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    test("recursively removes a directory with -r", () => {
      process.chdir(testBaseDir);
      const dirPath = path.join(testBaseDir, "folder");
      fs.mkdirSync(dirPath);
      fs.writeFileSync(path.join(dirPath, "inner.txt"), "inside");

      const result = executeCommand("rm", {
        args: ["folder"],
        flags: ["-r"],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(dirPath)).toBe(false);
    });

    test("returns error when file does not exist without -f", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("rm", {
        args: ["nonexistent.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "rm: cannot remove 'nonexistent.txt': No such file or directory",
      });
    });

    test("succeeds silently when file does not exist with -f", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("rm", {
        args: ["nonexistent.txt"],
        flags: ["-f"],
      });

      expect(result).toEqual({ output: "", error: null });
    });

    test("supports combined -rf and -fr flags to force remove directories", () => {
      process.chdir(testBaseDir);
      const dir1 = path.join(testBaseDir, "dir1");
      const dir2 = path.join(testBaseDir, "dir2");
      fs.mkdirSync(dir1);
      fs.mkdirSync(dir2);
      fs.writeFileSync(path.join(dir1, "f.txt"), "test");

      const res1 = executeCommand("rm", {
        args: ["dir1"],
        flags: ["-rf"],
      });
      expect(res1).toEqual({ output: "", error: null });
      expect(fs.existsSync(dir1)).toBe(false);

      const res2 = executeCommand("rm", {
        args: ["dir2"],
        flags: ["-fr"],
      });
      expect(res2).toEqual({ output: "", error: null });
      expect(fs.existsSync(dir2)).toBe(false);
    });

    test("removes multiple files in one command", () => {
      process.chdir(testBaseDir);
      const f1 = path.join(testBaseDir, "f1.txt");
      const f2 = path.join(testBaseDir, "f2.txt");
      fs.writeFileSync(f1, "1");
      fs.writeFileSync(f2, "2");

      const result = executeCommand("rm", {
        args: ["f1.txt", "f2.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(f1)).toBe(false);
      expect(fs.existsSync(f2)).toBe(false);
    });

    test("returns error on missing operand", () => {
      const result = executeCommand("rm", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "rm: missing operand",
      });
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("rm", {
        args: ["f.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "rm: invalid option -- 'z'",
      });
    });

    test("refuses to remove . and ..", () => {
      process.chdir(testBaseDir);
      expect(executeCommand("rm", { args: ["."], flags: ["-rf"] })).toEqual({
        output: null,
        error: "rm: refusing to remove '.' or '..' directory: skipping '.'",
      });
      expect(executeCommand("rm", { args: [".."], flags: ["-rf"] })).toEqual({
        output: null,
        error: "rm: refusing to remove '.' or '..' directory: skipping '..'",
      });
    });

    test("rm updates ls output dynamically", () => {
      process.chdir(testBaseDir);

      executeCommand("touch", { args: ["target.txt"], flags: [] });
      expect(executeCommand("ls").output).toContain("target.txt");

      executeCommand("rm", { args: ["target.txt"], flags: [] });
      expect(executeCommand("ls").output).not.toContain("target.txt");
    });
  });

  describe("cp command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-cp-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("copies a file to a new file name", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "source.txt"), "hello copy");

      const result = executeCommand("cp", {
        args: ["source.txt", "dest.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "dest.txt"))).toBe(true);
      expect(fs.readFileSync(path.join(testBaseDir, "dest.txt"), "utf-8")).toBe(
        "hello copy"
      );
    });

    test("copies a file into an existing directory", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "source.txt"), "into dir");
      fs.mkdirSync(path.join(testBaseDir, "target_dir"));

      const result = executeCommand("cp", {
        args: ["source.txt", "target_dir"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      const copiedPath = path.join(testBaseDir, "target_dir", "source.txt");
      expect(fs.existsSync(copiedPath)).toBe(true);
      expect(fs.readFileSync(copiedPath, "utf-8")).toBe("into dir");
    });

    test("recursively copies a directory with -r", () => {
      process.chdir(testBaseDir);
      const srcDir = path.join(testBaseDir, "src_dir");
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, "inner.txt"), "inside src");

      const result = executeCommand("cp", {
        args: ["src_dir", "dest_dir"],
        flags: ["-r"],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(
        fs.existsSync(path.join(testBaseDir, "dest_dir", "inner.txt"))
      ).toBe(true);
      expect(
        fs.readFileSync(
          path.join(testBaseDir, "dest_dir", "inner.txt"),
          "utf-8"
        )
      ).toBe("inside src");
    });

    test("returns error when attempting to copy directory without -r", () => {
      process.chdir(testBaseDir);
      const srcDir = path.join(testBaseDir, "src_dir");
      fs.mkdirSync(srcDir);

      const result = executeCommand("cp", {
        args: ["src_dir", "dest_dir"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cp: -r not specified; omitting directory 'src_dir'",
      });
    });

    test("copies multiple files into an existing directory", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "f1.txt"), "1");
      fs.writeFileSync(path.join(testBaseDir, "f2.txt"), "2");
      fs.mkdirSync(path.join(testBaseDir, "bucket"));

      const result = executeCommand("cp", {
        args: ["f1.txt", "f2.txt", "bucket"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "bucket", "f1.txt"))).toBe(
        true
      );
      expect(fs.existsSync(path.join(testBaseDir, "bucket", "f2.txt"))).toBe(
        true
      );
    });

    test("returns error when multiple sources provided and destination is not a directory", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "f1.txt"), "1");
      fs.writeFileSync(path.join(testBaseDir, "f2.txt"), "2");

      const result = executeCommand("cp", {
        args: ["f1.txt", "f2.txt", "non_directory"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cp: target 'non_directory' is not a directory",
      });
    });

    test("returns error when source file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("cp", {
        args: ["missing.txt", "dest.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cp: cannot stat 'missing.txt': No such file or directory",
      });
    });

    test("returns error when copying a file to itself", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "same.txt"), "same");

      const result = executeCommand("cp", {
        args: ["same.txt", "same.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "cp: 'same.txt' and 'same.txt' are the same file",
      });
    });

    test("returns error when missing destination operand", () => {
      const result = executeCommand("cp", { args: ["single.txt"], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "cp: missing destination file operand after 'single.txt'",
      });
    });

    test("returns error when missing file operand", () => {
      const result = executeCommand("cp", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "cp: missing file operand",
      });
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("cp", {
        args: ["a.txt", "b.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "cp: invalid option -- 'z'",
      });
    });

    test("cp integrates seamlessly with cat and ls", () => {
      process.chdir(testBaseDir);

      executeCommand("touch", { args: ["original.txt"], flags: [] });
      fs.writeFileSync(
        path.join(testBaseDir, "original.txt"),
        "copied content"
      );

      executeCommand("cp", {
        args: ["original.txt", "duplicate.txt"],
        flags: [],
      });
      expect(executeCommand("ls").output).toContain("duplicate.txt");
      expect(
        executeCommand("cat", { args: ["duplicate.txt"], flags: [] }).output
      ).toBe("copied content");
    });
  });

  describe("mv command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-mv-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("renames a file (mv oldname newname)", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "oldname.txt"), "rename me");

      const result = executeCommand("mv", {
        args: ["oldname.txt", "newname.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "oldname.txt"))).toBe(false);
      expect(fs.existsSync(path.join(testBaseDir, "newname.txt"))).toBe(true);
      expect(
        fs.readFileSync(path.join(testBaseDir, "newname.txt"), "utf-8")
      ).toBe("rename me");
    });

    test("moves a file into an existing directory (mv file /path/)", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "file.txt"), "move me");
      fs.mkdirSync(path.join(testBaseDir, "dest_dir"));

      const result = executeCommand("mv", {
        args: ["file.txt", "dest_dir"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "file.txt"))).toBe(false);
      const movedPath = path.join(testBaseDir, "dest_dir", "file.txt");
      expect(fs.existsSync(movedPath)).toBe(true);
      expect(fs.readFileSync(movedPath, "utf-8")).toBe("move me");
    });

    test("renames a directory", () => {
      process.chdir(testBaseDir);
      const oldDir = path.join(testBaseDir, "old_folder");
      fs.mkdirSync(oldDir);
      fs.writeFileSync(path.join(oldDir, "inner.txt"), "inner");

      const result = executeCommand("mv", {
        args: ["old_folder", "new_folder"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(oldDir)).toBe(false);
      expect(
        fs.existsSync(path.join(testBaseDir, "new_folder", "inner.txt"))
      ).toBe(true);
    });

    test("moves multiple files into an existing directory", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "f1.txt"), "1");
      fs.writeFileSync(path.join(testBaseDir, "f2.txt"), "2");
      fs.mkdirSync(path.join(testBaseDir, "target_dir"));

      const result = executeCommand("mv", {
        args: ["f1.txt", "f2.txt", "target_dir"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(fs.existsSync(path.join(testBaseDir, "f1.txt"))).toBe(false);
      expect(fs.existsSync(path.join(testBaseDir, "f2.txt"))).toBe(false);
      expect(
        fs.existsSync(path.join(testBaseDir, "target_dir", "f1.txt"))
      ).toBe(true);
      expect(
        fs.existsSync(path.join(testBaseDir, "target_dir", "f2.txt"))
      ).toBe(true);
    });

    test("returns error when multiple sources provided and destination is not a directory", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "f1.txt"), "1");
      fs.writeFileSync(path.join(testBaseDir, "f2.txt"), "2");

      const result = executeCommand("mv", {
        args: ["f1.txt", "f2.txt", "not_a_dir"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "mv: target 'not_a_dir' is not a directory",
      });
    });

    test("returns error when source does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("mv", {
        args: ["ghost.txt", "dest.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "mv: cannot stat 'ghost.txt': No such file or directory",
      });
    });

    test("returns error when moving a file to itself", () => {
      process.chdir(testBaseDir);
      fs.writeFileSync(path.join(testBaseDir, "self.txt"), "content");

      const result = executeCommand("mv", {
        args: ["self.txt", "self.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "mv: 'self.txt' and 'self.txt' are the same file",
      });
    });

    test("returns error when moving directory into its own subdirectory", () => {
      process.chdir(testBaseDir);
      const parentDir = path.join(testBaseDir, "parent");
      const childDir = path.join(parentDir, "child");
      fs.mkdirSync(parentDir);
      fs.mkdirSync(childDir);

      const result = executeCommand("mv", {
        args: ["parent", "parent/child"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error:
          "mv: cannot move a directory, 'parent', into itself, 'parent/child'",
      });
    });

    test("returns error on missing operands", () => {
      expect(executeCommand("mv", { args: [], flags: [] })).toEqual({
        output: null,
        error: "mv: missing file operand",
      });

      expect(
        executeCommand("mv", { args: ["only_one.txt"], flags: [] })
      ).toEqual({
        output: null,
        error: "mv: missing destination file operand after 'only_one.txt'",
      });
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("mv", {
        args: ["a.txt", "b.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "mv: invalid option -- 'z'",
      });
    });

    test("integrates with ls and cat dynamically", () => {
      process.chdir(testBaseDir);
      executeCommand("touch", { args: ["draft.txt"], flags: [] });
      fs.writeFileSync(path.join(testBaseDir, "draft.txt"), "final text");

      executeCommand("mv", { args: ["draft.txt", "published.txt"], flags: [] });

      const lsOutput = executeCommand("ls").output;
      expect(lsOutput).not.toContain("draft.txt");
      expect(lsOutput).toContain("published.txt");
      expect(
        executeCommand("cat", { args: ["published.txt"], flags: [] }).output
      ).toBe("final text");
    });
  });

  describe("find command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-find-"));
      fs.writeFileSync(path.join(testBaseDir, "file1.txt"), "hello");
      fs.writeFileSync(path.join(testBaseDir, "file2.log"), "log");
      fs.mkdirSync(path.join(testBaseDir, "subdir"));
      fs.writeFileSync(
        path.join(testBaseDir, "subdir", "nested.txt"),
        "nested"
      );
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("find . lists root, files, and subdirectories", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", { args: ["."], flags: [] });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toContain(".");
      expect(lines).toContain("./file1.txt");
      expect(lines).toContain("./file2.log");
      expect(lines).toContain("./subdir");
      expect(lines).toContain("./subdir/nested.txt");
    });

    test("find . -name '*.txt' finds only matching filenames", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", {
        args: [".", "*.txt"],
        flags: ["-name"],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toContain("./file1.txt");
      expect(lines).toContain("./subdir/nested.txt");
      expect(lines).not.toContain("./file2.log");
      expect(lines).not.toContain("./subdir");
    });

    test("find supports linear arguments format", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", {
        args: [".", "-name", "*.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toContain("./file1.txt");
      expect(lines).toContain("./subdir/nested.txt");
    });

    test("find -type f finds files only", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", {
        args: [".", "f"],
        flags: ["-type"],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toContain("./file1.txt");
      expect(lines).toContain("./file2.log");
      expect(lines).toContain("./subdir/nested.txt");
      expect(lines).not.toContain("./subdir");
      expect(lines).not.toContain(".");
    });

    test("find -type d finds directories only", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", {
        args: [".", "d"],
        flags: ["-type"],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toContain(".");
      expect(lines).toContain("./subdir");
      expect(lines).not.toContain("./file1.txt");
    });

    test("find combines -name and -type filters", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", {
        args: [".", "-name", "*.txt", "-type", "f"],
        flags: [],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toEqual(["./file1.txt", "./subdir/nested.txt"]);
    });

    test("returns error when target path does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("find", {
        args: ["nonexistent_path"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "find: 'nonexistent_path': No such file or directory",
      });
    });

    test("returns error when missing argument to -name or -type", () => {
      const errName = executeCommand("find", {
        args: ["."],
        flags: ["-name"],
      });
      expect(errName.error).toBe("find: missing argument to '-name'");

      const errType = executeCommand("find", {
        args: ["."],
        flags: ["-type"],
      });
      expect(errType.error).toBe("find: missing argument to '-type'");
    });

    test("returns error on unknown argument to -type", () => {
      const result = executeCommand("find", {
        args: [".", "x"],
        flags: ["-type"],
      });
      expect(result.error).toBe("find: Unknown argument to -type: x");
    });
  });

  describe("grep command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-grep-"));
      fs.writeFileSync(
        path.join(testBaseDir, "hello.txt"),
        "Hello World\nAnother line\nhello again\n"
      );
      fs.writeFileSync(
        path.join(testBaseDir, "other.txt"),
        "A different text\nhello from other\n"
      );
      fs.mkdirSync(path.join(testBaseDir, "nested"));
      fs.writeFileSync(
        path.join(testBaseDir, "nested", "deep.txt"),
        "Deep hello inside\nNothing here\n"
      );
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("searches pattern in single file", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["hello", "hello.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("hello again");
    });

    test("searches case-insensitively with -i", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["hello", "hello.txt"],
        flags: ["-i"],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toEqual(["Hello World", "hello again"]);
    });

    test("searches recursively with -r", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["Deep", "nested"],
        flags: ["-r"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("nested/deep.txt:Deep hello inside");
    });

    test("prefixes filenames when searching multiple files", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["hello", "hello.txt", "other.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toContain("hello.txt:hello again");
      expect(lines).toContain("other.txt:hello from other");
    });

    test("returns empty output when pattern not found", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["notfound", "hello.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
    });

    test("returns error when target is a directory without -r", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["hello", "nested"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "grep: nested: Is a directory",
      });
    });

    test("returns error when target file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["hello", "missing.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "grep: missing.txt: No such file or directory",
      });
    });

    test("returns error on missing operands", () => {
      expect(executeCommand("grep", { args: [], flags: [] })).toEqual({
        output: null,
        error: "grep: missing pattern",
      });

      expect(executeCommand("grep", { args: ["pattern"], flags: [] })).toEqual({
        output: null,
        error: "grep: missing file operand",
      });
    });

    test("supports -n line numbers and -v invert match", () => {
      process.chdir(testBaseDir);
      const resN = executeCommand("grep", {
        args: ["hello", "hello.txt"],
        flags: ["-n"],
      });
      expect(resN.output).toBe("3:hello again");

      const resV = executeCommand("grep", {
        args: ["hello", "hello.txt"],
        flags: ["-v"],
      });
      expect(resV.output).toBe("Hello World\nAnother line");
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("grep", {
        args: ["pattern", "hello.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "grep: invalid option -- 'z'",
      });
    });
  });

  describe("head command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-head-"));
      const lines = [];
      for (let i = 1; i <= 20; i++) {
        lines.push(`Line ${i}`);
      }
      fs.writeFileSync(
        path.join(testBaseDir, "twenty.txt"),
        lines.join("\n") + "\n"
      );
      fs.writeFileSync(path.join(testBaseDir, "short.txt"), "A\nB\nC\n");
      fs.mkdirSync(path.join(testBaseDir, "a_dir"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("prints first 10 lines by default", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["twenty.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      const outputLines = result.output.split("\n");
      expect(outputLines.length).toBe(10);
      expect(outputLines[0]).toBe("Line 1");
      expect(outputLines[9]).toBe("Line 10");
    });

    test("prints specified number of lines with -n", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["3", "twenty.txt"],
        flags: ["-n"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("Line 1\nLine 2\nLine 3");
    });

    test("supports shorthand -N number flag", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["twenty.txt"],
        flags: ["-2"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("Line 1\nLine 2");
    });

    test("outputs all lines if file has fewer lines than requested", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["short.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("A\nB\nC");
    });

    test("formats multiple files with headers", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["short.txt", "twenty.txt"],
        flags: ["-2"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toContain("==> short.txt <==");
      expect(result.output).toContain("A\nB");
      expect(result.output).toContain("==> twenty.txt <==");
      expect(result.output).toContain("Line 1\nLine 2");
    });

    test("returns error when target file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["missing.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error:
          "head: cannot open 'missing.txt' for reading: No such file or directory",
      });
    });

    test("returns error when target is a directory", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["a_dir"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "head: error reading 'a_dir': Is a directory",
      });
    });

    test("returns error on missing file operand", () => {
      const result = executeCommand("head", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "head: missing file operand",
      });
    });

    test("returns error on invalid line number", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("head", {
        args: ["abc", "twenty.txt"],
        flags: ["-n"],
      });

      expect(result).toEqual({
        output: null,
        error: "head: invalid number of lines: 'abc'",
      });
    });
  });

  describe("tail command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-tail-"));
      const lines = [];
      for (let i = 1; i <= 20; i++) {
        lines.push(`Line ${i}`);
      }
      fs.writeFileSync(
        path.join(testBaseDir, "twenty.txt"),
        lines.join("\n") + "\n"
      );
      fs.writeFileSync(path.join(testBaseDir, "short.txt"), "A\nB\nC\n");
      fs.mkdirSync(path.join(testBaseDir, "a_dir"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("prints last 10 lines by default", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["twenty.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      const outputLines = result.output.split("\n");
      expect(outputLines.length).toBe(10);
      expect(outputLines[0]).toBe("Line 11");
      expect(outputLines[9]).toBe("Line 20");
    });

    test("prints specified number of lines with -n", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["3", "twenty.txt"],
        flags: ["-n"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("Line 18\nLine 19\nLine 20");
    });

    test("supports shorthand -N number flag", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["twenty.txt"],
        flags: ["-2"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("Line 19\nLine 20");
    });

    test("outputs all lines if file has fewer lines than requested", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["short.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("A\nB\nC");
    });

    test("formats multiple files with headers", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["short.txt", "twenty.txt"],
        flags: ["-2"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toContain("==> short.txt <==");
      expect(result.output).toContain("B\nC");
      expect(result.output).toContain("==> twenty.txt <==");
      expect(result.output).toContain("Line 19\nLine 20");
    });

    test("returns error when target file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["missing.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error:
          "tail: cannot open 'missing.txt' for reading: No such file or directory",
      });
    });

    test("returns error when target is a directory", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["a_dir"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "tail: error reading 'a_dir': Is a directory",
      });
    });

    test("returns error on missing file operand", () => {
      const result = executeCommand("tail", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "tail: missing file operand",
      });
    });

    test("returns error on invalid line number", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("tail", {
        args: ["abc", "twenty.txt"],
        flags: ["-n"],
      });

      expect(result).toEqual({
        output: null,
        error: "tail: invalid number of lines: 'abc'",
      });
    });
  });

  describe("wc command", () => {
    let testBaseDir;

    beforeEach(() => {
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-wc-"));
      // 3 lines, 7 words, 36 bytes (with \n)
      fs.writeFileSync(
        path.join(testBaseDir, "sample.txt"),
        "hello world\nthis is a test\nfinal line\n"
      );
      // 1 line, 2 words, 11 bytes
      fs.writeFileSync(path.join(testBaseDir, "short.txt"), "simple text\n");
      fs.mkdirSync(path.join(testBaseDir, "a_dir"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("prints lines, words, bytes by default", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt"],
        flags: [],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("3 8 38 sample.txt");
    });

    test("counts lines only with -l", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt"],
        flags: ["-l"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("3 sample.txt");
    });

    test("counts words only with -w", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt"],
        flags: ["-w"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("8 sample.txt");
    });

    test("counts bytes only with -c", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt"],
        flags: ["-c"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("38 sample.txt");
    });

    test("supports combined flags like -lw", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt"],
        flags: ["-lw"],
      });

      expect(result.error).toBeNull();
      expect(result.output).toBe("3 8 sample.txt");
    });

    test("outputs counts for multiple files plus a total line", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt", "short.txt"],
        flags: ["-l"],
      });

      expect(result.error).toBeNull();
      const lines = result.output.split("\n");
      expect(lines).toEqual(["3 sample.txt", "1 short.txt", "4 total"]);
    });

    test("returns error when target file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["missing.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "wc: missing.txt: No such file or directory",
      });
    });

    test("returns error when target is a directory", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["a_dir"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "wc: a_dir: Is a directory",
      });
    });

    test("returns error on missing file operand", () => {
      const result = executeCommand("wc", { args: [], flags: [] });

      expect(result).toEqual({
        output: null,
        error: "wc: missing file operand",
      });
    });

    test("returns error on invalid flag option", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("wc", {
        args: ["sample.txt"],
        flags: ["-z"],
      });

      expect(result).toEqual({
        output: null,
        error: "wc: invalid option -- 'z'",
      });
    });
  });

  describe("file permissions and node metadata (Phase 3.3)", () => {
    let testBaseDir;

    beforeEach(() => {
      resetNodeMetadata();
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-perm-"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      resetNodeMetadata();
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("converts numeric mode to Unix permission string", () => {
      expect(modeToPermissionString(0o755)).toBe("rwxr-xr-x");
      expect(modeToPermissionString("755")).toBe("rwxr-xr-x");
      expect(modeToPermissionString(0o644)).toBe("rw-r--r--");
      expect(modeToPermissionString("644")).toBe("rw-r--r--");
      expect(modeToPermissionString(0o777)).toBe("rwxrwxrwx");
      expect(modeToPermissionString(0o600)).toBe("rw-------");
    });

    test("converts Unix permission string to numeric octal mode", () => {
      expect(permissionStringToMode("rwxr-xr-x")).toBe(0o755);
      expect(permissionStringToMode("rw-r--r--")).toBe(0o644);
      expect(permissionStringToMode("rwxrwxrwx")).toBe(0o777);
      expect(permissionStringToMode("rw-------")).toBe(0o600);
    });

    test("touch creates a file with default permissions, owner, and group", () => {
      process.chdir(testBaseDir);
      const filePath = path.join(testBaseDir, "file.txt");
      executeCommand("touch", { args: ["file.txt"], flags: [] });

      const meta = getNodeMetadata(filePath);
      expect(meta.permissions).toBe("rw-r--r--");
      expect(meta.owner).toBe("guest_user");
      expect(meta.group).toBe("users");
    });

    test("mkdir creates a directory with default permissions, owner, and group", () => {
      process.chdir(testBaseDir);
      const dirPath = path.join(testBaseDir, "folder");
      executeCommand("mkdir", { args: ["folder"], flags: [] });

      const meta = getNodeMetadata(dirPath);
      expect(meta.permissions).toBe("rwxr-xr-x");
      expect(meta.owner).toBe("guest_user");
      expect(meta.group).toBe("users");
    });

    test("ls -l displays permissions, owner, and group", () => {
      process.chdir(testBaseDir);
      executeCommand("touch", { args: ["sample.txt"], flags: [] });
      executeCommand("mkdir", { args: ["testdir"], flags: [] });

      const result = executeCommand("ls", { args: [], flags: ["-l"] });
      expect(result.error).toBeNull();

      const lines = result.output.split("\n");
      const sampleLine = lines.find((l) => l.startsWith("sample.txt"));
      expect(sampleLine).toBeDefined();
      const sampleParts = sampleLine.split("\t");
      expect(sampleParts[0]).toBe("sample.txt");
      expect(sampleParts[1]).toBe("file");
      expect(sampleParts[4]).toBe("rw-r--r--");
      expect(sampleParts[5]).toBe("guest_user");
      expect(sampleParts[6]).toBe("users");

      const dirLine = lines.find((l) => l.startsWith("testdir"));
      expect(dirLine).toBeDefined();
      const dirParts = dirLine.split("\t");
      expect(dirParts[0]).toBe("testdir");
      expect(dirParts[1]).toBe("directory");
      expect(dirParts[4]).toBe("rwxr-xr-x");
      expect(dirParts[5]).toBe("guest_user");
      expect(dirParts[6]).toBe("users");
    });

    test("cp preserves node metadata in destination", () => {
      process.chdir(testBaseDir);
      executeCommand("touch", { args: ["orig.txt"], flags: [] });
      const origPath = path.join(testBaseDir, "orig.txt");
      setNodeMetadata(origPath, {
        permissions: "rwxrwxrwx",
        owner: "admin",
        group: "wheel",
      });

      executeCommand("cp", { args: ["orig.txt", "copy.txt"], flags: [] });
      const copyPath = path.join(testBaseDir, "copy.txt");
      const copyMeta = getNodeMetadata(copyPath);
      expect(copyMeta.permissions).toBe("rwxrwxrwx");
      expect(copyMeta.owner).toBe("admin");
      expect(copyMeta.group).toBe("wheel");
    });

    test("mv preserves node metadata and removes old metadata", () => {
      process.chdir(testBaseDir);
      executeCommand("touch", { args: ["old.txt"], flags: [] });
      const oldPath = path.join(testBaseDir, "old.txt");
      setNodeMetadata(oldPath, {
        permissions: "rwxr-x---",
        owner: "dev",
        group: "developers",
      });

      executeCommand("mv", { args: ["old.txt", "new.txt"], flags: [] });
      const newPath = path.join(testBaseDir, "new.txt");
      const newMeta = getNodeMetadata(newPath);
      expect(newMeta.permissions).toBe("rwxr-x---");
      expect(newMeta.owner).toBe("dev");
      expect(newMeta.group).toBe("developers");
    });

    test("rm removes node metadata on deletion", () => {
      process.chdir(testBaseDir);
      executeCommand("touch", { args: ["delete_me.txt"], flags: [] });
      const delPath = path.join(testBaseDir, "delete_me.txt");
      expect(getNodeMetadata(delPath).owner).toBe("guest_user");

      executeCommand("rm", { args: ["delete_me.txt"], flags: [] });
      expect(fs.existsSync(delPath)).toBe(false);
    });
  });

  describe("chmod command - numeric mode (Phase 3.3)", () => {
    let testBaseDir;

    beforeEach(() => {
      resetNodeMetadata();
      testBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-cli-os-chmod-"));
      fs.writeFileSync(path.join(testBaseDir, "file1.txt"), "hello");
      fs.writeFileSync(path.join(testBaseDir, "file2.txt"), "world");
      fs.mkdirSync(path.join(testBaseDir, "subdir"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      resetNodeMetadata();
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("changes file permissions using numeric octal mode (chmod 755)", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "file1.txt");

      const result = executeCommand("chmod", {
        args: ["755", "file1.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      const meta = getNodeMetadata(target);
      expect(meta.permissions).toBe("rwxr-xr-x");
    });

    test("changes directory permissions using numeric octal mode (chmod 700)", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "subdir");

      const result = executeCommand("chmod", {
        args: ["700", "subdir"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      const meta = getNodeMetadata(target);
      expect(meta.permissions).toBe("rwx------");
    });

    test("changes permissions of multiple files at once", () => {
      process.chdir(testBaseDir);
      const target1 = path.join(testBaseDir, "file1.txt");
      const target2 = path.join(testBaseDir, "file2.txt");

      const result = executeCommand("chmod", {
        args: ["600", "file1.txt", "file2.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target1).permissions).toBe("rw-------");
      expect(getNodeMetadata(target2).permissions).toBe("rw-------");
    });

    test("returns error on missing operand", () => {
      const result = executeCommand("chmod", { args: [], flags: [] });
      expect(result).toEqual({
        output: null,
        error: "chmod: missing operand",
      });
    });

    test("returns error on missing operand after mode", () => {
      const result = executeCommand("chmod", { args: ["755"], flags: [] });
      expect(result).toEqual({
        output: null,
        error: "chmod: missing operand after '755'",
      });
    });

    test("returns error when target file does not exist", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("chmod", {
        args: ["755", "missing.txt"],
        flags: [],
      });
      expect(result).toEqual({
        output: null,
        error: "chmod: cannot access 'missing.txt': No such file or directory",
      });
    });

    test("returns error when mode is invalid", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("chmod", {
        args: ["999", "file1.txt"],
        flags: [],
      });
      expect(result).toEqual({
        output: null,
        error: "chmod: invalid mode: '999'",
      });
    });
  });

  describe("chmod command - symbolic mode (Phase 3.3)", () => {
    let testBaseDir;

    beforeEach(() => {
      resetNodeMetadata();
      testBaseDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "web-cli-os-chmod-sym-")
      );
      fs.writeFileSync(path.join(testBaseDir, "file1.txt"), "hello");
      fs.writeFileSync(path.join(testBaseDir, "file2.txt"), "world");
      fs.mkdirSync(path.join(testBaseDir, "subdir"));
    });

    afterEach(() => {
      process.chdir(startingCwd);
      resetNodeMetadata();
      if (fs.existsSync(testBaseDir)) {
        fs.rmSync(testBaseDir, { recursive: true, force: true });
      }
    });

    test("parseSymbolicMode accurately applies clauses", () => {
      expect(parseSymbolicMode("rw-r--r--", "u+x")).toBe("rwxr--r--");
      expect(parseSymbolicMode("rw-r--r--", "g-r")).toBe("rw----r--");
      expect(parseSymbolicMode("rw-r--r--", "go-r")).toBe("rw-------");
      expect(parseSymbolicMode("rw-r--r--", "a=rwx")).toBe("rwxrwxrwx");
      expect(parseSymbolicMode("rw-r--r--", "+x")).toBe("rwxr-xr-x");
      expect(parseSymbolicMode("rwxrwxrwx", "go-w,o-x")).toBe("rwxr-xr--");
    });

    test("adds execute permission for owner (chmod u+x)", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "file1.txt");
      // Default file perm is rw-r--r--
      const result = executeCommand("chmod", {
        args: ["u+x", "file1.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target).permissions).toBe("rwxr--r--");
    });

    test("removes read permission for group (chmod g-r)", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "file1.txt");
      const result = executeCommand("chmod", {
        args: ["g-r", "file1.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target).permissions).toBe("rw----r--");
    });

    test("sets exact permissions using = operator (chmod u=rwx,go=r)", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "file1.txt");
      const result = executeCommand("chmod", {
        args: ["u=rwx,go=r", "file1.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target).permissions).toBe("rwxr--r--");
    });

    test("supports shorthand +x on files", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "file1.txt");
      const result = executeCommand("chmod", {
        args: ["+x", "file1.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target).permissions).toBe("rwxr-xr-x");
    });

    test("supports flag-extracted negative symbolic mode (-w)", () => {
      process.chdir(testBaseDir);
      const target = path.join(testBaseDir, "file1.txt");
      const result = executeCommand("chmod", {
        args: ["file1.txt"],
        flags: ["-w"],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target).permissions).toBe("r--r--r--");
    });

    test("applies symbolic mode across multiple targets", () => {
      process.chdir(testBaseDir);
      const target1 = path.join(testBaseDir, "file1.txt");
      const target2 = path.join(testBaseDir, "file2.txt");

      const result = executeCommand("chmod", {
        args: ["a+x", "file1.txt", "file2.txt"],
        flags: [],
      });

      expect(result).toEqual({ output: "", error: null });
      expect(getNodeMetadata(target1).permissions).toBe("rwxr-xr-x");
      expect(getNodeMetadata(target2).permissions).toBe("rwxr-xr-x");
    });

    test("returns error when symbolic syntax is invalid", () => {
      process.chdir(testBaseDir);
      const result = executeCommand("chmod", {
        args: ["u*x", "file1.txt"],
        flags: [],
      });

      expect(result).toEqual({
        output: null,
        error: "chmod: invalid mode: 'u*x'",
      });
    });
  });
});
