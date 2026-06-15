const { parseCommand } = require("../modules/commandParser");

describe("Command Parser", () => {

    test("parses simple command with no args", () => {
        expect(parseCommand("pwd")).toEqual({
            name: "pwd",
            args: [],
            flags: []
        });
    });

    test("parses command with one argument", () => {
        expect(parseCommand("mkdir testFolder")).toEqual({
            name: "mkdir",
            args: ["testFolder"],
            flags: []
        });
    });

    test("parses command with one flag", () => {
        expect(parseCommand("ls -la")).toEqual({
            name: "ls",
            args: [],
            flags: ["-la"]
        });
    });

    test("parses command with flag and argument", () => {
        expect(parseCommand("ls -la /home")).toEqual({
            name: "ls",
            args: ["/home"],
            flags: ["-la"]
        });
    });

    test("handles multiple flags", () => {
        expect(parseCommand("ls -l -a --color")).toEqual({
            name: "ls",
            args: [],
            flags: ["-l", "-a", "--color"]
        });
    });

    test("handles multiple arguments", () => {
        expect(parseCommand("cp source.txt dest.txt")).toEqual({
            name: "cp",
            args: ["source.txt", "dest.txt"],
            flags: []
        });
    });

    test("handles quoted string argument", () => {
        expect(parseCommand('echo "hello world"')).toEqual({
            name: "echo",
            args: ["hello world"],
            flags: []
        });
    });

    test("handles quoted filename with spaces", () => {
        expect(parseCommand('cp "my file.txt" backup.txt')).toEqual({
            name: "cp",
            args: ["my file.txt", "backup.txt"],
            flags: []
        });
    });

    test("handles extra spaces", () => {
        expect(parseCommand("   ls    -la     /home   ")).toEqual({
            name: "ls",
            args: ["/home"],
            flags: ["-la"]
        });
    });

    test("handles empty input", () => {
        expect(parseCommand("")).toEqual({
            name: "",
            args: [],
            flags: []
        });
    });

    test("handles spaces-only input", () => {
        expect(parseCommand("      ")).toEqual({
            name: "",
            args: [],
            flags: []
        });
    });

    test("handles empty quoted string", () => {
        expect(parseCommand('echo ""')).toEqual({
            name: "echo",
            args: [""],
            flags: []
        });
    });

});