import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const PROMPT = 'user@web-os:~$';

function App() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'system', text: 'Welcome to Web-CLI-OS v1.0' },
    { type: 'system', text: 'Type "help" to see available commands.' }
  ]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [history]);

  const executeCommand = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    setHistory((prev) => [...prev, { type: 'input', text: `${PROMPT} ${trimmedInput}` }]);
    setInput('');

    try {
      const response = await fetch('http://localhost:5000/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedInput })
      });
      const data = await response.json();
      const nextLine =
        data.output
          ? { type: 'output', text: data.output }
          : data.error
            ? { type: 'error', text: data.error }
            : { type: 'system', text: 'Command completed with no output.' };

      setHistory((prev) => [
        ...prev,
        nextLine
      ]);
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        { type: 'error', text: 'Fatal Error: Cannot connect to Node server.' }
      ]);
    }
  };

  return (
    <main className="terminal" onClick={() => inputRef.current?.focus()}>
      <section className="terminal-output" aria-live="polite">
        {history.map((line, index) => (
          <div
            key={`${line.type}-${index}`}
            className={`terminal-line terminal-line-${line.type}`}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </section>

      <form
        className="terminal-prompt-row"
        onSubmit={(event) => {
          event.preventDefault();
          executeCommand();
        }}
      >
        <span className="terminal-prompt">{PROMPT}</span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="Terminal command input"
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
        <span className="terminal-cursor" aria-hidden="true" />
      </form>
    </main>
  );
}

export default App;
