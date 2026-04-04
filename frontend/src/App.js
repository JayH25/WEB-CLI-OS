import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleSend = async () => {
    try {
      const response = await fetch('http://localhost:5000/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await response.json();
      setOutput(data.output || data.error);
    } catch (error) {
      setOutput("Error connecting to backend");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1e1e1e', color: '#00ff00', height: '100vh' }}>
      <h2>Web CLI OS - Pipeline Test</h2>
      
      <div style={{ marginBottom: '20px', minHeight: '50px' }}>
        <strong>System Output:</strong>
        <p>{output}</p>
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type 'ping' here..."
        style={{ background: 'black', color: 'lime', border: '1px solid lime', padding: '10px', width: '300px' }}
      />
      
      <button onClick={handleSend} style={{ marginLeft: '10px', background: 'lime', color: 'black', padding: '10px 20px', border: 'none', cursor: 'pointer' }}>
        Send Command
      </button>
    </div>
  );
}

export default App;