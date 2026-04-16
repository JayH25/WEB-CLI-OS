import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const PROMPT = "user@web-os:~$";

function App() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { type: "system", text: "Welcome to Web-CLI-OS v1.0" },
    { type: "system", text: 'Type "help" to see available commands.' },
  ]);
  const [time, setTime] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ block: "end" });
    }
  }, [history]);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const executeCommand = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    setHistory((prev) => [
      ...prev,
      { type: "input", text: `${PROMPT} ${trimmedInput}` },
    ]);
    setInput("");

    try {
      const response = await fetch("http://localhost:5000/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmedInput }),
      });
      const data = await response.json();
      const nextLine = {
        type: data.type || "output",
        text: data.output || "No output",
      };

      setHistory((prev) => [...prev, nextLine]);
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        { type: "error", text: "Fatal Error: Cannot connect to Node server." },
      ]);
    }
  };

  const renderHistoryLine = (line) => {
    if (line.type === "input" && line.text.startsWith(`${PROMPT} `)) {
      const commandText = line.text.slice(PROMPT.length + 1);

      return (
        <>
          <span className="history-prompt">{PROMPT}</span>{" "}
          <span className="history-command">{commandText}</span>
        </>
      );
    }

    return line.text;
  };

  return (
    <main className="terminal" onClick={() => inputRef.current?.focus()}>
      {/*  Title Bar */}
      <div className="title-bar">
        <div className="title-left">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="os-name">WEB-CLI-OS</span>
        </div>

        <div className="title-right">{time}</div>
      </div>
      <section className="terminal-output" aria-live="polite">
        {history.map((line, index) => (
          <div
            key={`${line.type}-${index}`}
            className={`terminal-line terminal-line-${line.type}`}
          >
            {renderHistoryLine(line)}
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
        <div className="input-wrapper">
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

          <span
            className="block-cursor"
            style={{
              left: `${input.length * 8}px`,
            }}
          />
        </div>
        {/* <span className="terminal-cursor" aria-hidden="true" /> */}
      </form>
    </main>
  );
}

export default App;
