/**
 * Parses a raw command string into:
 * {
 *   name: "ls",
 *   args: ["/home"],
 *   flags: ["-la"]
 * }
 *
 * Example:
 * Input:  "ls -la /home"
 * Output: {
 *   name: "ls",
 *   args: ["/home"],
 *   flags: ["-la"]
 * }
 */
function parseCommand(input) {

    if (typeof input !== "string") {
    return {
        name: "",
        args: [],
        flags: []
    };
    }

    // Remove extra spaces from start/end
    // Example:
    // "   ls -la /home   "
    // becomes
    // "ls -la /home"
    const trimmedInput = input.trim();

    // If user entered nothing,return an empty command object.
    if (!trimmedInput) {
        return {
            name: "",
            args: [],
            flags: []
        };
    }

    // Split the command into individual words.

    //a quoted string OR  A normal non-whitespace token
    const rawTokens = trimmedInput.match(/"([^"]*)"|\S+/g) || [];

    const tokens = rawTokens.map(token => {
    // Check if the token starts and ends with a double quote.
    if (
        token.startsWith('"') &&
        token.endsWith('"')
    ) {
        //remove both quotes
        return token.slice(1, -1);
    }

    return token;
});

    // The first token is always considered
    // the command name.
    //
    // Example:
    // ["ls", "-la", "/home"]
    //
    // name = "ls"
    const name = tokens[0];

    // Store normal arguments here.
    //
    // Example:
    // "/home"
    const args = [];

    // Store flags here.
    //
    // Example:
    // "-la"
    const flags = [];

    // Start from index 1 because
    // index 0 is the command name.
    for (let i = 1; i < tokens.length; i++) {

        const token = tokens[i];

        // Any token beginning with '-'
        // is treated as a flag.
        //
        // Examples:
        // -a
        // -l
        // -la
        // --help
        if (token.startsWith("-")) {
            flags.push(token);
        }

        // Otherwise it is a normal argument.
        //
        // Examples:
        // /home
        // file.txt
        // documents
        else {
            args.push(token);
        }
    }

    // Return the parsed command object.
    return {
        name,
        args,
        flags
    };
}

module.exports = {
    parseCommand
};