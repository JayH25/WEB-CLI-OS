/* eslint-env jest */

const fs = require("fs");
const os = require("os");
const path = require("path");
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
    expect(result.output).toContain("ls");
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
});
