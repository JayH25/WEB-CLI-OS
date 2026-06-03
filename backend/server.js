const express = require("express");
const cors = require("cors"); // used for frontend to talk to backend , else browser blocks the request
const fs = require("fs"); // file system, used to check if files exists
const path = require("path"); // used for file paths
const { spawn } = require("child_process"); // used by node to run another program (here, cpp engine)
const morgan = require("morgan");

const app = express(); // creates backend app
app.use(cors()); // establishes the connection
app.use(express.json()); // allows backend to read json data from the 'req'
app.use(morgan("dev")); // morgan dependency is used for, priting the POST and GET types of request.

const PORT = process.env.PORT || 5000 ; 

// Start engine once
const engineCandidates = [
  path.resolve(__dirname, "../engine/main"), // location of engine, for macos
  path.resolve(__dirname, "../engine/main.exe"), // location of engine  ofr windows
];
const enginePath = engineCandidates.find(
  (
    candidate // We check each of the 2 paths, and see, which one is exists
  ) => fs.existsSync(candidate)
);
let engineProcess = null; // stores the running cpp process

if (enginePath) {
  // if engine exists, start it as a child process, and store in engineProcess
  engineProcess = spawn(enginePath); // start the cpp process, from the nodejs , and give me control over it
  // engineProcess is the object, which gives us control. What control ?
  /**
   1) Can send input to c++ (like hello)
   2) Read output from c++(like reading what c++ prints)
   3) Read errors
   4) Kill it if needed (kill the child !)
   5) and also, starts it
That is the core reason, that we are storing the process, so we can use it again and again, for these above tasks
   */
} else {
  console.error(
    "Engine binary not found. Compile it in the engine folder before starting backend."
  );
}
// child process -> process(child) , started by another process(parent)

// Same variables
let outputBuffer = ""; // stores output coming from the cpp (temporary storage)
let currentResponseObject = null; // stores current HTTP response

const respondToClient = (payload) => {
  if (!currentResponseObject) {
    return;
  }

  currentResponseObject.json(payload);
  currentResponseObject = null;
};

const inferLegacyType = (text) => {
  const normalized = (text || "").toLowerCase();

  if (
    normalized.startsWith("error:") ||
    normalized.includes("command not recognized") ||
    normalized.includes("engine error")
  ) {
    return "error";
  }

  return "output";
};

// Listen to C++ output
if (engineProcess) {
  engineProcess.stdout.on("data", (data) => {
    // Whenever C++ prints something → this runs
    outputBuffer += data.toString(); // append the output in the variable

    // Legacy protocol support: output text + ===END_OF_COMMAND=== marker.
    if (outputBuffer.includes("===END_OF_COMMAND===")) {
      const markerIndex = outputBuffer.indexOf("===END_OF_COMMAND===");
      const cleanOutput = outputBuffer.slice(0, markerIndex).trim();
      outputBuffer = outputBuffer.slice(
        markerIndex + "===END_OF_COMMAND===".length
      );
      respondToClient({
        type: inferLegacyType(cleanOutput),
        output: cleanOutput,
      });
      return;
    }

    // New protocol support: one JSON response per line from sendResponse.
    if (outputBuffer.includes("\n")) {
      const lineEnd = outputBuffer.indexOf("\n");
      const firstLine = outputBuffer.slice(0, lineEnd).trim();

      if (firstLine.startsWith("{")) {
        try {
          const parsed = JSON.parse(firstLine);
          outputBuffer = outputBuffer.slice(lineEnd + 1);
          respondToClient({
            type: parsed.type || "output",
            output: parsed.output || "",
          });
        } catch (_error) {
          // Wait for more chunks when line is incomplete JSON.
        }
      }
    }
  });

  // Error handling
  engineProcess.stderr.on("data", (data) => {
    console.log("C++ Error:", data.toString());
  });

  engineProcess.on("error", (err) => {
    console.error("Failed to start engine:", err.message);
  });
}

app.get("/ping", (req, res) => {// This is a request made to check firstly, if server is even reachable or not, We will use this for denbuging.
  res.json({status: "ok"})
});

// Handle request
app.post("/command", (req, res, next) => {
  try {
    if (!engineProcess) {
    res.status(503).json({
      output: "Engine is not available. Compile engine/main.cpp first.",
    });
    return;
  }

  const {command} = req.body; 

  if(typeof(command) != "string" || !command.trim()) {
    res.status(400).json({
      error: "Proper command is required",
    });
    return ;
  }
    currentResponseObject = res;

    engineProcess.stdin.write(`${command.trim()}\n`);
  } catch(error) {
    next(error) ; // Instead of writing everything here, we throw the error to central error handler
  }

});

app.use((err, req, res, next) => {
  console.log(err) ; 
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal Server Error" ,
  });
});

app.listen(PORT, () => {
  console.log(`Backend is running on port: ${PORT} `);
});
