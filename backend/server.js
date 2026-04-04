require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const enginePath = '../engine/main.exe';

app.post('/command', (req, res) => {
    const { text } = req.body;
    
    const engineProcess = spawn(enginePath);
    
    engineProcess.stdout.on('data', (data) => {
        res.json({ output: data.toString() });
        engineProcess.kill();
    });

    engineProcess.stderr.on('data', (data) => {
        res.status(500).json({ error: data.toString() });
        engineProcess.kill();
    });

    
    engineProcess.stdin.write(text + '\n');
    engineProcess.stdin.end();
});

app.listen(PORT,()=>{
  console.log(`Backend is running on port: ${PORT}`);
})