import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [input, setInput] = useState('');
  // History will store an array of everything typed and answered
  const [history, setHistory] = useState([
    { type: 'output', text: 'Welcome to Web-CLI-OS v1.0' },
    { type: 'output', text: 'Type "help" to see available commands.' }
  ]);
  
  // This helps us auto-scroll to the bottom
  const bottomRef = useRef(null);

  // Auto-scroll whenever history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = async () => {
    if (!input.trim()) return;

    // 1. Add the user's command to the screen immediately
    const newHistory = [...history, { type: 'input', text: `root@nexus-os:~$ ${input}` }];
    setHistory(newHistory);
    const commandToSend = input;
    setInput(''); // Clear the input box

    try {
      // 2. Send it to your Node backend
      const response = await fetch('http://localhost:5000/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commandToSend })
      });
      
      const data = await response.json();
      
      // 3. Add the C++ answer to the screen
      setHistory((prev) => [...prev, { type: 'output', text: data.output || data.error }]);
    } catch (error) {
      setHistory((prev) => [...prev, { type: 'output', text: "Fatal Error: Cannot connect to Node server." }]);
    }
  };

  // Listen for the "Enter" key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#0a0a0a', 
      color: '#00ff00', 
      fontFamily: '"Courier New", Courier, monospace', 
      height: '100vh', 
      padding: '20px', 
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* The Terminal Screen area */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {history.map((line, index) => (
          <div key={index} style={{ 
            marginBottom: '5px', 
            color: line.type === 'input' ? '#00ff00' : '#a3a3a3',
            whiteSpace: 'pre-wrap' 
          }}>
            {line.text}
          </div>
        ))}
        {/* Invisible element to help us scroll to the bottom */}
        <div ref={bottomRef} />
      </div>

      {/* The Input area */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '10px', color: '#00ff00' }}>root@nexus-os:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#00ff00', 
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '16px',
            outline: 'none',
            flex: 1
          }}
        />
      </div>

    </div>
  );
}

export default App;