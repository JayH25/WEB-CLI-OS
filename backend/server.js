const express = require("express"); 
const cors = require("cors"); // used for frontend to talk to backend , else browser blocks the request
const fs = require("fs"); // file system, used to check if files exists
const path = require("path"); // used for file paths
const { spawn } = require("child_process"); // used by node to run another program (here, cpp engine)

const app = express(); // creates backend app
app.use(cors()); // establishes the connection
app.use(express.json()); // allows backend to read json data from the 'req'

// Start engine once
const engineCandidates = [
  path.resolve(__dirname, "../engine/main"), // location of engine, for macos
  path.resolve(__dirname, "../engine/main.exe"), // location of engine  ofr windows
];
const enginePath = engineCandidates.find((candidate) => // We check each of the 2 paths, and see, which one is exists
  fs.existsSync(candidate),
);
let engineProcess = null; // stores the running cpp process 

if (enginePath) { // if engine exists, start it as a child process, and store in engineProcess
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
    "Engine binary not found. Compile it in the engine folder before starting backend.",
  );
}
// child process -> process(child) , started by another process(parent)

// Same variables
let outputBuffer = ""; // stores output coming from the cpp (temporary storage)
let currentResponseObject = null; // stores current HTTP response 

// Listen to C++ output
if (engineProcess) {
  engineProcess.stdout.on("data", (data) => { // Whenever C++ prints something → this runs
    outputBuffer += data.toString(); // append the output in the variable

    if (outputBuffer.includes("===END_OF_COMMAND===")) { // C++ has finished processing
      // Clean output
      let cleanOutput = outputBuffer.replace("===END_OF_COMMAND===", "").trim();

      if (currentResponseObject) {
        currentResponseObject.json({ output: cleanOutput });
        currentResponseObject = null;
      }

      outputBuffer = ""; // reset buffer
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

// Handle request
app.post("/command", (req, res) => {
  if (!engineProcess) {
    res
      .status(503)
      .json({
        output: "Engine is not available. Compile engine/main.cpp first.",
      });
    return;
  }

  const text = req.body.text;

  currentResponseObject = res;

  // Send command to C++
  engineProcess.stdin.write(text + "\n");
});

app.listen(5000, () => {
  console.log("Backend is running on port: 5000");
});
