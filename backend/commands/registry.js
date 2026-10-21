const fs = require("fs");
const os = require("os");
const path = require("path");

let previousWorkingDirectory = null;

const resolveHomeDirectory = () =>
  process.env.HOME ||
  process.env.USERPROFILE ||
  (typeof os.homedir === "function" ? os.homedir() : null);

const getPreviousWorkingDirectory = () => previousWorkingDirectory;

const setPreviousWorkingDirectory = (dir) => {
  previousWorkingDirectory = dir;
};

const resetPreviousWorkingDirectory = () => {
  previousWorkingDirectory = null;
};

const formatDateTime = (date) =>
  date.toISOString().replace("T", " ").slice(0, 19);

const parseLsFlags = (flags) => {
  let showAll = false;
  let longFormat = false;

  for (const flag of flags) {
    if (flag === "-") {
      return { error: "ls: invalid option -- '-'" };
    }

    if (!flag.startsWith("-")) {
      return { error: `ls: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "a") {
        showAll = true;
      } else if (option === "l") {
        longFormat = true;
      } else {
        return { error: `ls: invalid option -- '${option}'` };
      }
    }
  }

  return { showAll, longFormat };
};

const buildLsEntry = (entryPath, displayName) => {
  const stats = fs.statSync(entryPath);

  return {
    name: displayName,
    type: stats.isDirectory() ? "directory" : "file",
    size: stats.size,
    date: formatDateTime(stats.mtime),
  };
};

const formatLsOutput = (entries, longFormat) => {
  if (longFormat) {
    return entries
      .map(
        (entry) => `${entry.name}\t${entry.type}\t${entry.size}\t${entry.date}`
      )
      .join("\n");
  }

  return entries.map((entry) => entry.name).join("\n");
};

const helpCommand = () => {
  return {
    output:
      "Available commands: help, echo, clear, date, ls, whoami, uname, pwd, cd",
    error: null,
  };
};

const echoCommand = ({ args }) => {
  return {
    output: args.join(" "), // Echo back all arguments joined by space
    error: null,
  };
};

const clearCommand = () => {
  return {
    output: "",
    error: null,
    clearScreen: true, // A custom flag your frontend can interpret to clear the terminal
  };
};

const dateCommand = () => {
  return {
    output: new Date().toString(),
    error: null,
  };
};

const whoamiCommand = () => {
  return {
    output: "guest_user", // Hardcoded for now
    error: null,
  };
};

const unameCommand = () => {
  return {
    output: "Nexus-WebOS v1.0", // Hardcoded OS info for now
    error: null,
  };
};

const pwdCommand = ({ args, flags }) => {
  if (args.length > 0) {
    return {
      output: null,
      error: "pwd: too many arguments",
    };
  }

  let usePhysicalPath = false;

  for (const flag of flags) {
    if (flag === "-L") {
      usePhysicalPath = false;
    } else if (flag === "-P") {
      usePhysicalPath = true;
    } else {
      return {
        output: null,
        error: `pwd: invalid option -- '${flag.replace(/^-+/, "")}'`,
      };
    }
  }

  const currentWorkingDirectory = usePhysicalPath
    ? fs.realpathSync(process.cwd())
    : process.cwd();

  return {
    output: currentWorkingDirectory,
    error: null,
  };
};

const lsCommand = ({ args, flags }) => {
  if (args.length > 1) {
    return {
      output: null,
      error: "ls: too many arguments",
    };
  }

  const parsedFlags = parseLsFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  const targetPath = path.resolve(process.cwd(), args[0] || ".");

  if (!fs.existsSync(targetPath)) {
    return {
      output: null,
      error: `ls: cannot access '${args[0] || "."}': No such file or directory`,
    };
  }

  let entries = [];

  try {
    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
      const directoryEntries = fs.readdirSync(targetPath);

      if (parsedFlags.showAll) {
        entries.push(buildLsEntry(targetPath, "."));
        entries.push(buildLsEntry(path.resolve(targetPath, ".."), ".."));
      }

      entries.push(
        ...directoryEntries
          .filter((name) => parsedFlags.showAll || !name.startsWith("."))
          .sort((left, right) => left.localeCompare(right))
          .map((name) => buildLsEntry(path.join(targetPath, name), name))
      );
    } else {
      entries = [buildLsEntry(targetPath, path.basename(targetPath))];
    }
  } catch (error) {
    return {
      output: null,
      error: `ls: cannot access '${args[0] || "."}': ${error.message}`,
    };
  }

  return {
    output: formatLsOutput(entries, parsedFlags.longFormat),
    error: null,
  };
};

const parseCdFlags = (flags) => {
  let usePhysicalPath = false;
  let hasDashOperand = false;

  for (const flag of flags) {
    if (flag === "-") {
      hasDashOperand = true;
      continue;
    }

    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-")) {
      return { error: `cd: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "L") {
        usePhysicalPath = false;
      } else if (option === "P") {
        usePhysicalPath = true;
      } else {
        return { error: `cd: invalid option -- '${option}'` };
      }
    }
  }

  return { usePhysicalPath, hasDashOperand };
};

const cdCommand = ({ args = [], flags = [], session = {} }) => {
  const parsedFlags = parseCdFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  const { usePhysicalPath, hasDashOperand } = parsedFlags;

  if (hasDashOperand && args.length > 0) {
    return {
      output: null,
      error: "cd: too many arguments",
    };
  }

  if (args.length > 1) {
    return {
      output: null,
      error: "cd: too many arguments",
    };
  }

  let isPreviousDirNavigation = false;
  let rawTarget = null;
  let targetPath = null;

  if (hasDashOperand) {
    rawTarget = "-";
    isPreviousDirNavigation = true;
  } else if (args.length === 1) {
    rawTarget = args[0];
    if (rawTarget === "-") {
      isPreviousDirNavigation = true;
    }
  }

  if (args.length === 1 && rawTarget === "") {
    return {
      output: null,
      error: "cd: : No such file or directory",
    };
  }

  if (isPreviousDirNavigation) {
    const prevDir = (session && session.oldPwd) || previousWorkingDirectory;
    if (!prevDir) {
      return {
        output: null,
        error: "cd: OLDPWD not set",
      };
    }
    targetPath = prevDir;
  } else if (!rawTarget || rawTarget === "~") {
    const homeDir = resolveHomeDirectory();
    if (!homeDir) {
      return {
        output: null,
        error: "cd: HOME not set",
      };
    }
    targetPath = homeDir;
  } else if (rawTarget.startsWith("~/") || rawTarget.startsWith("~\\")) {
    const homeDir = resolveHomeDirectory();
    if (!homeDir) {
      return {
        output: null,
        error: "cd: HOME not set",
      };
    }
    targetPath = path.join(homeDir, rawTarget.slice(2));
  } else {
    targetPath = path.resolve(process.cwd(), rawTarget);
  }

  if (!fs.existsSync(targetPath)) {
    return {
      output: null,
      error: `cd: ${rawTarget}: No such file or directory`,
    };
  }

  try {
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return {
        output: null,
        error: `cd: ${rawTarget}: Not a directory`,
      };
    }
  } catch (error) {
    return {
      output: null,
      error: `cd: ${rawTarget}: ${error.message}`,
    };
  }

  let resolvedTargetPath = targetPath;
  if (usePhysicalPath) {
    try {
      resolvedTargetPath = fs.realpathSync(targetPath);
    } catch (error) {
      return {
        output: null,
        error: `cd: ${rawTarget}: ${error.message}`,
      };
    }
  }

  const currentDir = process.cwd();

  try {
    process.chdir(resolvedTargetPath);
  } catch (error) {
    return {
      output: null,
      error: `cd: ${rawTarget}: ${error.message}`,
    };
  }

  const newWorkingDirectory = process.cwd();
  previousWorkingDirectory = currentDir;
  if (session && typeof session === "object") {
    session.oldPwd = currentDir;
  }

  return {
    output: isPreviousDirNavigation ? newWorkingDirectory : "",
    error: null,
  };
};

// ---------------------------------------------------------
// The Command Registry
// ---------------------------------------------------------
const commandRegistry = {
  help: helpCommand,
  echo: echoCommand,
  clear: clearCommand,
  date: dateCommand,
  ls: lsCommand,
  whoami: whoamiCommand,
  uname: unameCommand,
  pwd: pwdCommand,
  cd: cdCommand,
};

/*
 Executes a command based on its name.
 -> commandName-string - The name of the command to run (e.g., 'echo')
 -> context-object - The context containing args, flags, and session
 -> returns (object) Result containing { output, error }
 */
const executeCommand = (
  commandName,
  context = { args: [], flags: [], session: {} }
) => {
  const normalizedContext = {
    args: Array.isArray(context.args) ? context.args : [],
    flags: Array.isArray(context.flags) ? context.flags : [],
    session: context.session || {},
  };

  const handler = commandRegistry[commandName];

  // Fallback for unknown commands, mimicking bash
  if (!handler) {
    return {
      output: null,
      error: `bash: ${commandName}: command not found`,
    };
  }

  try {
    return handler(normalizedContext);
  } catch (err) {
    return {
      output: null,
      error: `Error executing ${commandName}: ${err.message}`,
    };
  }
};

module.exports = {
  executeCommand,
  commandRegistry,
  resetPreviousWorkingDirectory,
  getPreviousWorkingDirectory,
  setPreviousWorkingDirectory,
};
