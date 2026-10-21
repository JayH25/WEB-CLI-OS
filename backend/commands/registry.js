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
      "Available commands: help, echo, clear, date, ls, whoami, uname, pwd, cd, mkdir, touch, cat, rm, cp, mv, find, grep",
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

const parseMkdirFlags = (flags) => {
  let parents = false;

  for (const flag of flags) {
    if (flag === "--parents") {
      parents = true;
      continue;
    }

    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `mkdir: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "p") {
        parents = true;
      } else {
        return { error: `mkdir: invalid option -- '${option}'` };
      }
    }
  }

  return { parents };
};

const mkdirCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseMkdirFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  if (args.length === 0) {
    return {
      output: null,
      error: "mkdir: missing operand",
    };
  }

  const { parents } = parsedFlags;

  for (const target of args) {
    if (target === "") {
      return {
        output: null,
        error: "mkdir: cannot create directory '': No such file or directory",
      };
    }

    const targetPath = path.resolve(process.cwd(), target);

    if (parents) {
      if (fs.existsSync(targetPath)) {
        try {
          const stats = fs.statSync(targetPath);
          if (!stats.isDirectory()) {
            return {
              output: null,
              error: `mkdir: cannot create directory '${target}': File exists`,
            };
          }
        } catch (error) {
          return {
            output: null,
            error: `mkdir: cannot create directory '${target}': ${error.message}`,
          };
        }
        continue;
      }

      try {
        fs.mkdirSync(targetPath, { recursive: true });
      } catch (error) {
        if (error.code === "EEXIST") {
          return {
            output: null,
            error: `mkdir: cannot create directory '${target}': File exists`,
          };
        }
        if (error.code === "ENOTDIR") {
          return {
            output: null,
            error: `mkdir: cannot create directory '${target}': Not a directory`,
          };
        }
        return {
          output: null,
          error: `mkdir: cannot create directory '${target}': ${error.message}`,
        };
      }
    } else {
      if (fs.existsSync(targetPath)) {
        return {
          output: null,
          error: `mkdir: cannot create directory '${target}': File exists`,
        };
      }

      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        return {
          output: null,
          error: `mkdir: cannot create directory '${target}': No such file or directory`,
        };
      }

      try {
        const parentStats = fs.statSync(parentDir);
        if (!parentStats.isDirectory()) {
          return {
            output: null,
            error: `mkdir: cannot create directory '${target}': Not a directory`,
          };
        }

        fs.mkdirSync(targetPath);
      } catch (error) {
        return {
          output: null,
          error: `mkdir: cannot create directory '${target}': ${error.message}`,
        };
      }
    }
  }

  return {
    output: "",
    error: null,
  };
};

const parseTouchFlags = (flags) => {
  let noCreate = false;

  for (const flag of flags) {
    if (flag === "--no-create") {
      noCreate = true;
      continue;
    }

    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `touch: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "c") {
        noCreate = true;
      } else {
        return { error: `touch: invalid option -- '${option}'` };
      }
    }
  }

  return { noCreate };
};

const touchCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseTouchFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  if (args.length === 0) {
    return {
      output: null,
      error: "touch: missing file operand",
    };
  }

  const { noCreate } = parsedFlags;
  const now = new Date();

  for (const target of args) {
    if (target === "") {
      return {
        output: null,
        error: "touch: cannot touch '': No such file or directory",
      };
    }

    const targetPath = path.resolve(process.cwd(), target);

    if (fs.existsSync(targetPath)) {
      try {
        fs.utimesSync(targetPath, now, now);
      } catch (error) {
        return {
          output: null,
          error: `touch: cannot touch '${target}': ${error.message}`,
        };
      }
    } else {
      if (noCreate) {
        continue;
      }

      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        return {
          output: null,
          error: `touch: cannot touch '${target}': No such file or directory`,
        };
      }

      try {
        const parentStats = fs.statSync(parentDir);
        if (!parentStats.isDirectory()) {
          return {
            output: null,
            error: `touch: cannot touch '${target}': Not a directory`,
          };
        }

        fs.writeFileSync(targetPath, "");
      } catch (error) {
        return {
          output: null,
          error: `touch: cannot touch '${target}': ${error.message}`,
        };
      }
    }
  }

  return {
    output: "",
    error: null,
  };
};

const formatNumberedLines = (content) => {
  if (content === "") return "";
  const lines = content.split("\n");
  const hasTrailingNewline = content.endsWith("\n");
  const linesToNumber = hasTrailingNewline ? lines.slice(0, -1) : lines;
  const formatted = linesToNumber
    .map((line, idx) => `     ${idx + 1}\t${line}`)
    .join("\n");
  return hasTrailingNewline ? `${formatted}\n` : formatted;
};

const parseCatFlags = (flags) => {
  let numberLines = false;

  for (const flag of flags) {
    if (flag === "--number") {
      numberLines = true;
      continue;
    }

    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `cat: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "n") {
        numberLines = true;
      } else {
        return { error: `cat: invalid option -- '${option}'` };
      }
    }
  }

  return { numberLines };
};

const catCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseCatFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  if (args.length === 0) {
    return {
      output: "",
      error: null,
    };
  }

  const { numberLines } = parsedFlags;
  const contents = [];

  for (const target of args) {
    if (target === "") {
      return {
        output: null,
        error: "cat: '': No such file or directory",
      };
    }

    const targetPath = path.resolve(process.cwd(), target);

    if (!fs.existsSync(targetPath)) {
      return {
        output: null,
        error: `cat: ${target}: No such file or directory`,
      };
    }

    try {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        return {
          output: null,
          error: `cat: ${target}: Is a directory`,
        };
      }

      const fileContent = fs.readFileSync(targetPath, "utf-8");
      contents.push(fileContent);
    } catch (error) {
      return {
        output: null,
        error: `cat: ${target}: ${error.message}`,
      };
    }
  }

  const concatenated = contents.join("");
  return {
    output: numberLines ? formatNumberedLines(concatenated) : concatenated,
    error: null,
  };
};

const parseRmFlags = (flags) => {
  let recursive = false;
  let force = false;

  for (const flag of flags) {
    if (flag === "--recursive") {
      recursive = true;
      continue;
    }
    if (flag === "--force") {
      force = true;
      continue;
    }
    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `rm: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "r" || option === "R") {
        recursive = true;
      } else if (option === "f") {
        force = true;
      } else {
        return { error: `rm: invalid option -- '${option}'` };
      }
    }
  }

  return { recursive, force };
};

const rmCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseRmFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  if (args.length === 0) {
    return {
      output: null,
      error: "rm: missing operand",
    };
  }

  const { recursive, force } = parsedFlags;

  for (const target of args) {
    if (target === "") {
      if (!force) {
        return {
          output: null,
          error: "rm: cannot remove '': No such file or directory",
        };
      }
      continue;
    }

    if (target === "." || target === "..") {
      return {
        output: null,
        error: `rm: refusing to remove '.' or '..' directory: skipping '${target}'`,
      };
    }

    const targetPath = path.resolve(process.cwd(), target);

    const rootPath = path.resolve("/");
    if (targetPath === rootPath) {
      return {
        output: null,
        error: "rm: it is dangerous to operate recursively on '/'",
      };
    }

    if (!fs.existsSync(targetPath)) {
      if (force) {
        continue;
      }
      return {
        output: null,
        error: `rm: cannot remove '${target}': No such file or directory`,
      };
    }

    try {
      const stats = fs.statSync(targetPath);

      if (stats.isDirectory()) {
        if (!recursive) {
          return {
            output: null,
            error: `rm: cannot remove '${target}': Is a directory`,
          };
        }

        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    } catch (error) {
      if (!force) {
        return {
          output: null,
          error: `rm: cannot remove '${target}': ${error.message}`,
        };
      }
    }
  }

  return {
    output: "",
    error: null,
  };
};

const parseCpFlags = (flags) => {
  let recursive = false;
  let force = false;

  for (const flag of flags) {
    if (flag === "--recursive") {
      recursive = true;
      continue;
    }
    if (flag === "--force") {
      force = true;
      continue;
    }
    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `cp: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "r" || option === "R") {
        recursive = true;
      } else if (option === "f") {
        force = true;
      } else {
        return { error: `cp: invalid option -- '${option}'` };
      }
    }
  }

  return { recursive, force };
};

const cpCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseCpFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  if (args.length === 0) {
    return {
      output: null,
      error: "cp: missing file operand",
    };
  }

  if (args.length === 1) {
    return {
      output: null,
      error: `cp: missing destination file operand after '${args[0]}'`,
    };
  }

  const { recursive } = parsedFlags;
  const destRaw = args[args.length - 1];
  const sourcesRaw = args.slice(0, args.length - 1);

  if (destRaw === "") {
    return {
      output: null,
      error: "cp: cannot create regular file '': No such file or directory",
    };
  }

  const destPath = path.resolve(process.cwd(), destRaw);
  const isDestDir =
    fs.existsSync(destPath) && fs.statSync(destPath).isDirectory();

  if (sourcesRaw.length > 1 && !isDestDir) {
    return {
      output: null,
      error: `cp: target '${destRaw}' is not a directory`,
    };
  }

  for (const srcRaw of sourcesRaw) {
    if (srcRaw === "") {
      return {
        output: null,
        error: "cp: cannot stat '': No such file or directory",
      };
    }

    const srcPath = path.resolve(process.cwd(), srcRaw);

    if (!fs.existsSync(srcPath)) {
      return {
        output: null,
        error: `cp: cannot stat '${srcRaw}': No such file or directory`,
      };
    }

    let srcStats;
    try {
      srcStats = fs.statSync(srcPath);
    } catch (error) {
      return {
        output: null,
        error: `cp: cannot stat '${srcRaw}': ${error.message}`,
      };
    }

    const isSrcDir = srcStats.isDirectory();

    if (isSrcDir && !recursive) {
      return {
        output: null,
        error: `cp: -r not specified; omitting directory '${srcRaw}'`,
      };
    }

    const targetDestPath = isDestDir
      ? path.join(destPath, path.basename(srcPath))
      : destPath;

    if (srcPath === targetDestPath) {
      return {
        output: null,
        error: `cp: '${srcRaw}' and '${destRaw}' are the same file`,
      };
    }

    if (isSrcDir) {
      const relative = path.relative(srcPath, targetDestPath);
      if (
        relative === "" ||
        (!relative.startsWith("..") && !path.isAbsolute(relative))
      ) {
        return {
          output: null,
          error: `cp: cannot copy a directory, '${srcRaw}', into itself, '${destRaw}'`,
        };
      }

      if (
        fs.existsSync(targetDestPath) &&
        !fs.statSync(targetDestPath).isDirectory()
      ) {
        return {
          output: null,
          error: `cp: cannot overwrite non-directory '${destRaw}' with directory '${srcRaw}'`,
        };
      }
    } else {
      if (
        fs.existsSync(targetDestPath) &&
        fs.statSync(targetDestPath).isDirectory()
      ) {
        return {
          output: null,
          error: `cp: cannot overwrite directory '${destRaw}' with non-directory '${srcRaw}'`,
        };
      }
    }

    const destParent = path.dirname(targetDestPath);
    if (!fs.existsSync(destParent)) {
      return {
        output: null,
        error: `cp: cannot create regular file '${destRaw}': No such file or directory`,
      };
    }

    try {
      const parentStats = fs.statSync(destParent);
      if (!parentStats.isDirectory()) {
        return {
          output: null,
          error: `cp: cannot create regular file '${destRaw}': Not a directory`,
        };
      }

      if (isSrcDir) {
        fs.cpSync(srcPath, targetDestPath, { recursive: true, force: true });
      } else {
        fs.copyFileSync(srcPath, targetDestPath);
      }
    } catch (error) {
      return {
        output: null,
        error: `cp: cannot copy '${srcRaw}' to '${destRaw}': ${error.message}`,
      };
    }
  }

  return {
    output: "",
    error: null,
  };
};

const parseMvFlags = (flags) => {
  let force = false;
  let noClobber = false;

  for (const flag of flags) {
    if (flag === "--force") {
      force = true;
      continue;
    }
    if (flag === "--no-clobber") {
      noClobber = true;
      continue;
    }
    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `mv: invalid option -- '${flag}'` };
    }

    for (const option of flag.slice(1)) {
      if (option === "f") {
        force = true;
      } else if (option === "n") {
        noClobber = true;
      } else {
        return { error: `mv: invalid option -- '${option}'` };
      }
    }
  }

  return { force, noClobber };
};

const mvCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseMvFlags(flags);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  if (args.length === 0) {
    return {
      output: null,
      error: "mv: missing file operand",
    };
  }

  if (args.length === 1) {
    return {
      output: null,
      error: `mv: missing destination file operand after '${args[0]}'`,
    };
  }

  const { noClobber } = parsedFlags;
  const destRaw = args[args.length - 1];
  const sourcesRaw = args.slice(0, args.length - 1);

  if (destRaw === "") {
    return {
      output: null,
      error: "mv: cannot move to '': No such file or directory",
    };
  }

  const destPath = path.resolve(process.cwd(), destRaw);
  const isDestDir =
    fs.existsSync(destPath) && fs.statSync(destPath).isDirectory();

  if (sourcesRaw.length > 1 && !isDestDir) {
    return {
      output: null,
      error: `mv: target '${destRaw}' is not a directory`,
    };
  }

  for (const srcRaw of sourcesRaw) {
    if (srcRaw === "") {
      return {
        output: null,
        error: "mv: cannot stat '': No such file or directory",
      };
    }

    const srcPath = path.resolve(process.cwd(), srcRaw);

    if (!fs.existsSync(srcPath)) {
      return {
        output: null,
        error: `mv: cannot stat '${srcRaw}': No such file or directory`,
      };
    }

    let srcStats;
    try {
      srcStats = fs.statSync(srcPath);
    } catch (error) {
      return {
        output: null,
        error: `mv: cannot stat '${srcRaw}': ${error.message}`,
      };
    }

    const isSrcDir = srcStats.isDirectory();
    const targetDestPath = isDestDir
      ? path.join(destPath, path.basename(srcPath))
      : destPath;

    if (srcPath === targetDestPath) {
      return {
        output: null,
        error: `mv: '${srcRaw}' and '${destRaw}' are the same file`,
      };
    }

    if (isSrcDir) {
      const relative = path.relative(srcPath, targetDestPath);
      if (
        relative === "" ||
        (!relative.startsWith("..") && !path.isAbsolute(relative))
      ) {
        return {
          output: null,
          error: `mv: cannot move a directory, '${srcRaw}', into itself, '${destRaw}'`,
        };
      }

      if (
        fs.existsSync(targetDestPath) &&
        !fs.statSync(targetDestPath).isDirectory()
      ) {
        return {
          output: null,
          error: `mv: cannot overwrite non-directory '${destRaw}' with directory '${srcRaw}'`,
        };
      }
    } else {
      if (
        fs.existsSync(targetDestPath) &&
        fs.statSync(targetDestPath).isDirectory()
      ) {
        return {
          output: null,
          error: `mv: cannot overwrite directory '${destRaw}' with non-directory '${srcRaw}'`,
        };
      }
    }

    if (noClobber && fs.existsSync(targetDestPath)) {
      continue;
    }

    const destParent = path.dirname(targetDestPath);
    if (!fs.existsSync(destParent)) {
      return {
        output: null,
        error: `mv: cannot move '${srcRaw}' to '${destRaw}': No such file or directory`,
      };
    }

    try {
      const parentStats = fs.statSync(destParent);
      if (!parentStats.isDirectory()) {
        return {
          output: null,
          error: `mv: cannot move '${srcRaw}' to '${destRaw}': Not a directory`,
        };
      }

      try {
        fs.renameSync(srcPath, targetDestPath);
      } catch (renameErr) {
        if (renameErr.code === "EXDEV") {
          if (isSrcDir) {
            fs.cpSync(srcPath, targetDestPath, {
              recursive: true,
              force: true,
            });
            fs.rmSync(srcPath, { recursive: true, force: true });
          } else {
            fs.copyFileSync(srcPath, targetDestPath);
            fs.unlinkSync(srcPath);
          }
        } else {
          throw renameErr;
        }
      }
    } catch (error) {
      return {
        output: null,
        error: `mv: cannot move '${srcRaw}' to '${destRaw}': ${error.message}`,
      };
    }
  }

  return {
    output: "",
    error: null,
  };
};

const globMatch = (pattern, str) => {
  let reStr = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      reStr += ".*";
    } else if (c === "?") {
      reStr += ".";
    } else if ("\\.+^$|()[]{}".includes(c)) {
      reStr += "\\" + c;
    } else {
      reStr += c;
    }
  }
  reStr += "$";
  return new RegExp(reStr).test(str);
};

const parseFindOptions = (args, flags) => {
  const hasOptionsInArgs = args.some((arg) => arg.startsWith("-"));

  let paths = [];
  let namePattern = null;
  let typeFilter = null;

  if (hasOptionsInArgs) {
    let i = 0;
    while (i < args.length) {
      const token = args[i];
      if (token === "-name") {
        if (i + 1 >= args.length) {
          return { error: "find: missing argument to '-name'" };
        }
        namePattern = args[i + 1];
        i += 2;
      } else if (token === "-type") {
        if (i + 1 >= args.length) {
          return { error: "find: missing argument to '-type'" };
        }
        typeFilter = args[i + 1];
        i += 2;
      } else if (token.startsWith("-")) {
        return { error: `find: unknown predicate '${token}'` };
      } else {
        paths.push(token);
        i += 1;
      }
    }
  } else {
    const optionsQueue = [];
    for (const flag of flags) {
      if (flag === "-name" || flag === "-type") {
        optionsQueue.push(flag);
      } else {
        return { error: `find: unknown predicate '${flag}'` };
      }
    }

    const neededValues = optionsQueue.length;
    if (args.length < neededValues) {
      const missingOption = optionsQueue[args.length];
      return { error: `find: missing argument to '${missingOption}'` };
    }

    if (
      args.length === neededValues &&
      (args[0] === "." ||
        args[0] === ".." ||
        args[0].startsWith("./") ||
        args[0].startsWith("/") ||
        args[0].startsWith("\\"))
    ) {
      const missingOption = optionsQueue[optionsQueue.length - 1];
      return { error: `find: missing argument to '${missingOption}'` };
    }

    const optionValues = args.slice(args.length - neededValues);
    paths = args.slice(0, args.length - neededValues);

    for (let j = 0; j < optionsQueue.length; j++) {
      const opt = optionsQueue[j];
      const val = optionValues[j];
      if (opt === "-name") {
        namePattern = val;
      } else if (opt === "-type") {
        typeFilter = val;
      }
    }
  }

  if (paths.length === 0) {
    paths = ["."];
  }

  if (typeFilter !== null && typeFilter !== "f" && typeFilter !== "d") {
    return { error: `find: Unknown argument to -type: ${typeFilter}` };
  }

  return { paths, namePattern, typeFilter };
};

const findCommand = ({ args = [], flags = [] }) => {
  const parsed = parseFindOptions(args, flags);

  if (parsed.error) {
    return {
      output: null,
      error: parsed.error,
    };
  }

  const { paths, namePattern, typeFilter } = parsed;
  const results = [];

  const matchesFilter = (itemPath, stats) => {
    if (typeFilter === "f" && !stats.isFile()) {
      return false;
    }
    if (typeFilter === "d" && !stats.isDirectory()) {
      return false;
    }
    if (namePattern !== null) {
      const base = path.basename(itemPath);
      if (!globMatch(namePattern, base)) {
        return false;
      }
    }
    return true;
  };

  for (const rootRaw of paths) {
    if (rootRaw === "") {
      return {
        output: null,
        error: "find: '': No such file or directory",
      };
    }

    const resolvedRoot = path.resolve(process.cwd(), rootRaw);

    if (!fs.existsSync(resolvedRoot)) {
      return {
        output: null,
        error: `find: '${rootRaw}': No such file or directory`,
      };
    }

    const rootNormalized = rootRaw.replace(/\\/g, "/");

    const walk = (currentFullPath, currentDisplayPath) => {
      let stats;
      try {
        stats = fs.statSync(currentFullPath);
      } catch (_err) {
        return;
      }

      if (matchesFilter(currentFullPath, stats)) {
        results.push(currentDisplayPath);
      }

      if (stats.isDirectory()) {
        let entries = [];
        try {
          entries = fs.readdirSync(currentFullPath).sort();
        } catch (_err) {
          return;
        }

        for (const entry of entries) {
          const nextFullPath = path.join(currentFullPath, entry);
          const nextDisplayPath =
            currentDisplayPath === "."
              ? `./${entry}`
              : `${currentDisplayPath.replace(/\/$/, "")}/${entry}`;

          walk(nextFullPath, nextDisplayPath);
        }
      }
    };

    walk(resolvedRoot, rootNormalized);
  }

  return {
    output: results.join("\n"),
    error: null,
  };
};

const parseGrepFlags = (flags, rawArgs) => {
  let recursive = false;
  let ignoreCase = false;
  let lineNumbers = false;
  let invertMatch = false;
  let filesWithMatches = false;

  const positional = [];
  const combined = [];

  for (const flag of flags) {
    combined.push(flag);
  }
  for (const arg of rawArgs) {
    if (
      arg.startsWith("-") &&
      combined.length === flags.length &&
      positional.length === 0
    ) {
      combined.push(arg);
    } else {
      positional.push(arg);
    }
  }

  for (const flag of combined) {
    if (flag === "--recursive") {
      recursive = true;
      continue;
    }
    if (flag === "--ignore-case") {
      ignoreCase = true;
      continue;
    }
    if (flag === "--line-number") {
      lineNumbers = true;
      continue;
    }
    if (flag === "--invert-match") {
      invertMatch = true;
      continue;
    }
    if (flag === "--files-with-matches") {
      filesWithMatches = true;
      continue;
    }
    if (flag === "--") {
      continue;
    }

    if (!flag.startsWith("-") || flag === "-") {
      return { error: `grep: invalid option -- '${flag}'` };
    }

    for (const opt of flag.slice(1)) {
      if (opt === "r" || opt === "R") {
        recursive = true;
      } else if (opt === "i") {
        ignoreCase = true;
      } else if (opt === "n") {
        lineNumbers = true;
      } else if (opt === "v") {
        invertMatch = true;
      } else if (opt === "l") {
        filesWithMatches = true;
      } else {
        return { error: `grep: invalid option -- '${opt}'` };
      }
    }
  }

  return {
    recursive,
    ignoreCase,
    lineNumbers,
    invertMatch,
    filesWithMatches,
    positional,
  };
};

const grepCommand = ({ args = [], flags = [] }) => {
  const parsedFlags = parseGrepFlags(flags, args);

  if (parsedFlags.error) {
    return {
      output: null,
      error: parsedFlags.error,
    };
  }

  const {
    recursive,
    ignoreCase,
    lineNumbers,
    invertMatch,
    filesWithMatches,
    positional,
  } = parsedFlags;

  if (positional.length === 0) {
    return {
      output: null,
      error: "grep: missing pattern",
    };
  }

  const pattern = positional[0];
  let targets = positional.slice(1);

  if (targets.length === 0) {
    if (recursive) {
      targets = ["."];
    } else {
      return {
        output: null,
        error: "grep: missing file operand",
      };
    }
  }

  let regex;
  try {
    regex = new RegExp(pattern, ignoreCase ? "i" : "");
  } catch (_e) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    regex = new RegExp(escaped, ignoreCase ? "i" : "");
  }

  const outputLines = [];
  const multipleTargets = targets.length > 1;

  const searchFile = (filePath, displayPath, prefixWithFile) => {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch (_err) {
      return;
    }

    const lines = content.split("\n");
    const linesToSearch = content.endsWith("\n") ? lines.slice(0, -1) : lines;

    for (let idx = 0; idx < linesToSearch.length; idx++) {
      const line = linesToSearch[idx];
      const isMatch = regex.test(line);
      const passes = invertMatch ? !isMatch : isMatch;

      if (passes) {
        if (filesWithMatches) {
          outputLines.push(displayPath);
          break;
        }

        let formattedLine = line;
        if (lineNumbers) {
          formattedLine = `${idx + 1}:${formattedLine}`;
        }
        if (prefixWithFile) {
          formattedLine = `${displayPath}:${formattedLine}`;
        }

        outputLines.push(formattedLine);
      }
    }
  };

  const walkDirectory = (dirPath, displayDir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dirPath).sort();
    } catch (_err) {
      return;
    }

    for (const entry of entries) {
      const childFullPath = path.join(dirPath, entry);
      const childDisplayPath =
        displayDir === "."
          ? `./${entry}`
          : `${displayDir.replace(/\/$/, "")}/${entry}`;

      let stats;
      try {
        stats = fs.statSync(childFullPath);
      } catch (_err) {
        continue;
      }

      if (stats.isDirectory()) {
        walkDirectory(childFullPath, childDisplayPath);
      } else if (stats.isFile()) {
        searchFile(childFullPath, childDisplayPath, true);
      }
    }
  };

  for (const target of targets) {
    if (target === "") {
      return {
        output: null,
        error: "grep: : No such file or directory",
      };
    }

    const targetPath = path.resolve(process.cwd(), target);

    if (!fs.existsSync(targetPath)) {
      return {
        output: null,
        error: `grep: ${target}: No such file or directory`,
      };
    }

    let stats;
    try {
      stats = fs.statSync(targetPath);
    } catch (err) {
      return {
        output: null,
        error: `grep: ${target}: ${err.message}`,
      };
    }

    if (stats.isDirectory()) {
      if (!recursive) {
        return {
          output: null,
          error: `grep: ${target}: Is a directory`,
        };
      }
      walkDirectory(targetPath, target.replace(/\\/g, "/"));
    } else {
      searchFile(
        targetPath,
        target.replace(/\\/g, "/"),
        multipleTargets || recursive
      );
    }
  }

  return {
    output: outputLines.join("\n"),
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
  mkdir: mkdirCommand,
  touch: touchCommand,
  cat: catCommand,
  rm: rmCommand,
  cp: cpCommand,
  mv: mvCommand,
  find: findCommand,
  grep: grepCommand,
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
