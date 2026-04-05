const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Start engine once
const enginePath = '../engine/main.exe';
const engineProcess = spawn(enginePath);

// Same variables
let outputBuffer = "";
let currentResponseObject = null;

// Listen to C++ output
engineProcess.stdout.on('data', (data) => {
    outputBuffer += data.toString();

    if (outputBuffer.includes("===END_OF_COMMAND===")) {

        // Clean output
        let cleanOutput = outputBuffer
            .replace("===END_OF_COMMAND===", "")
            .trim();

        if (currentResponseObject) {
            currentResponseObject.json({ output: cleanOutput });
            currentResponseObject = null;
        }

        outputBuffer = ""; // reset buffer
    }
});

// Error handling
engineProcess.stderr.on('data', (data) => {
    console.log("C++ Error:", data.toString());
});

// Handle request
app.post('/command', (req, res) => {
    const text = req.body.text;

    currentResponseObject = res;

    // Send command to C++
    engineProcess.stdin.write(text + '\n');
});

app.listen(5000, () => {
    console.log("Backend is running on port: 5000");
});