const fs = require("fs");

const helpCommand = () => {
  return {
    output: "Available commands: help, echo, clear, date, whoami, uname, pwd",
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

// ---------------------------------------------------------
// The Command Registry
// ---------------------------------------------------------
const commandRegistry = {
  help: helpCommand,
  echo: echoCommand,
  clear: clearCommand,
  date: dateCommand,
  whoami: whoamiCommand,
  uname: unameCommand,
  pwd: pwdCommand,
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
};
