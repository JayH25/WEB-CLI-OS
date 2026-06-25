
const helpCommand = ({ args, flags, session }) => {
    return { 
        output: "Available commands: help, echo, clear, date, whoami, uname", 
        error: null 
    };
};

const echoCommand = ({ args, flags, session }) => {
    return { 
        output: args.join(' '), // Echo back all arguments joined by space
        error: null 
    };
};

const clearCommand = ({ args, flags, session }) => {
    return { 
        output: "", 
        error: null,
        clearScreen: true // A custom flag your frontend can interpret to clear the terminal
    };
};

const dateCommand = ({ args, flags, session }) => {
    return { 
        output: new Date().toString(), 
        error: null 
    };
};

const whoamiCommand = ({ args, flags, session }) => {
    return { 
        output: "guest_user", // Hardcoded for now
        error: null 
    };
};

const unameCommand = ({ args, flags, session }) => {
    return { 
        output: "Nexus-WebOS v1.0", // Hardcoded OS info for now
        error: null 
    };
};

// ---------------------------------------------------------
// The Command Registry
// ---------------------------------------------------------
const commandRegistry = {
    'help': helpCommand,
    'echo': echoCommand,
    'clear': clearCommand,
    'date': dateCommand,
    'whoami': whoamiCommand,
    'uname': unameCommand,
};

/*
 Executes a command based on its name.
 -> commandName-string - The name of the command to run (e.g., 'echo')
 -> context-object - The context containing args, flags, and session
 -> returns (object) Result containing { output, error }
 */
const executeCommand = (commandName, context = { args: [], flags: {}, session: {} }) => {
    const handler = commandRegistry[commandName];

    // Fallback for unknown commands, mimicking bash
    if (!handler) {
        return {
            output: null,
            error: `bash: ${commandName}: command not found`
        };
    }

    try {
        return handler(context);
    } catch (err) {
        return {
            output: null,
            error: `Error executing ${commandName}: ${err.message}`
        };
    }
};

module.exports = {
    executeCommand,
    commandRegistry
};
