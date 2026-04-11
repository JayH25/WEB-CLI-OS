# 🖥️ WEB-CLI-OS

> A web-based command-line operating system — built from the ground up with a React frontend, Node.js backend, and a C++ engine.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js + Express |
| Engine | C++ |
| Real-time | WebSocket (Socket.io) |
| Storage | File system / SQLite |
| Deployment | Docker + CI/CD |

---

## ⚙️ Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- C++ compiler (`g++`)

### 1. Clone the Repository
```bash
git clone https://github.com/JayH25/WEB-CLI-OS.git
cd WEB-CLI-OS
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Engine Setup
```bash
cd ../engine
g++ main.cpp -o main
```

### 5. Running the Application
```bash
# Start Backend (from /backend)
npm run dev

# Start Frontend (from /frontend)
npm start
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### Environment Variables

**Backend (`/backend/.env`)**
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

**Frontend (`/frontend/.env.local`)**
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:5000` | Backend API URL |
| `REACT_APP_NODE_ENV` | `development` | Environment mode |

---

---

# 🗺️ COMPLETE PROJECT ROADMAP

> **Team:** 4 people | **Duration:** 4–5 months
>
> This roadmap goes phase by phase, feature by feature — from the most basic foundation all the way to an advanced, production-ready, resume-worthy OS. Every checkpoint builds on the one before it. Do not skip ahead.
>
> **Legend:**
> - `[ ]` — Not started
> - `[x]` — Completed

---

## 📋 PHASE 0 — Project Setup & Workflow  *(Week 1)*

> Before writing a single line of product code, get your team workflow right. This saves weeks of pain later.

### 0.1 — Git & Branching Strategy
- [ ] Set up a `main` branch (production-ready only) and a `dev` branch (active development)
- [ ] Agree on a branch naming convention: `feature/feature-name`, `fix/bug-name`, `chore/task-name`
- [ ] Write a `CONTRIBUTING.md` explaining how to open a PR, review, and merge
- [ ] Protect the `main` branch — no one pushes directly to main, everything goes through PRs
- [ ] Set up GitHub Issues and use labels: `bug`, `feature`, `enhancement`, `documentation`
- [ ] Create a GitHub Project board (Kanban) with columns: `Backlog`, `In Progress`, `Review`, `Done`

### 0.2 — Code Quality Tooling
- [ ] Add **ESLint** to both frontend and backend for consistent code style
- [ ] Add **Prettier** for auto-formatting
- [ ] Add `.editorconfig` to standardize indentation, line endings, etc.
- [ ] Add a `pre-commit` hook using `husky` + `lint-staged` to auto-lint before every commit
- [ ] Write a root-level `package.json` with scripts: `npm run dev` (starts everything), `npm run lint`, `npm run build`

### 0.3 — Project Architecture Decision
- [ ] Finalize and document the folder structure for frontend, backend, and engine
- [ ] Decide and document what the C++ engine is responsible for vs the Node backend
- [ ] Draw and commit an architecture diagram to the repo (can be a simple `.png` or ASCII)
- [ ] Assign ownership: who owns frontend, backend, engine, and DevOps/infra

---

## 📋 PHASE 1 — Core Terminal UI  *(Weeks 2–4)*

> Build the visual heart of the OS — the terminal itself. No logic yet, just the interface.

### 1.1 — Basic Terminal Layout
- [ ] Create a full-screen terminal component in React with a black background
- [ ] Add a prompt line at the bottom: `user@web-os:~$` followed by a blinking cursor
- [ ] Display the prompt as text (not editable) with an adjacent text input field for user typing
- [ ] On pressing `Enter`, capture the input and display it in the terminal output area above
- [ ] Clear the input field after each command submission
- [ ] Make the terminal scroll automatically to the bottom when new output is added

### 1.2 — Terminal Styling
- [ ] Use a monospace font throughout (e.g., `JetBrains Mono`, `Fira Code`, or `Courier New`)
- [ ] Style output lines: use different colors for command input (green/white), errors (red), and system messages (yellow/cyan)
- [ ] Add a blinking cursor animation using CSS keyframes
- [ ] Make the terminal container take up the full viewport with no scrollbars on the outer page
- [ ] Add a fake title bar at the top with: OS name, minimize/maximize/close buttons (decorative for now), and a clock showing current time

### 1.3 — Command History (Client-Side Only)
- [ ] Store all previously entered commands in an array in React state
- [ ] On pressing `Arrow Up`, replace the current input with the previous command
- [ ] On pressing `Arrow Down`, move forward through command history
- [ ] Keep history limited to the last 100 commands
- [ ] Display history with the `history` command (outputs a numbered list of past commands)

### 1.4 — Basic Output System
- [ ] Create a reusable `OutputLine` component with props: `text`, `type` (`input | output | error | system`)
- [ ] Store all output lines in a React state array and render them top-to-bottom
- [ ] Add a `clear` command that wipes all output from the terminal display
- [ ] On app startup, print a welcome banner with the OS name, version, and a tagline

---

## 📋 PHASE 2 — Backend Foundation & Command Routing  *(Weeks 4–6)*

> Connect the terminal to the backend. Every command typed goes to the server, and the server sends back a response.

### 2.1 — Express Backend Basics
- [ ] Ensure Express server is running and listening on port 5000
- [ ] Add a `POST /command` endpoint that accepts a JSON body `{ command: "ls" }` and returns `{ output: "..." }`
- [ ] Add a `GET /ping` health check endpoint that returns `{ status: "ok" }` — useful for debugging
- [ ] Add global error handling middleware that catches errors and returns clean JSON responses
- [ ] Add request logging middleware using `morgan` so you can see every request in your terminal

### 2.2 — Command Parser
- [ ] Create a `commandParser.js` module in the backend
- [ ] Parse a raw command string into: `{ name, args, flags }` (e.g., `"ls -la /home"` → `{ name: "ls", args: ["/home"], flags: ["-la"] }`)
- [ ] Handle quoted strings: `echo "hello world"` should treat `hello world` as one argument
- [ ] Handle edge cases: empty input, extra spaces, commands with no args
- [ ] Write unit tests for the parser using Jest (test at least 10 different input formats)

### 2.3 — Command Registry
- [ ] Create a `commands/` folder in the backend
- [ ] Create a `registry.js` file that maps command names to their handler functions
- [ ] Each handler receives `{ args, flags, session }` and returns `{ output, error }`
- [ ] Add an `unknown command` fallback that returns an error message like bash does
- [ ] Implement these basic commands as stub handlers first (output placeholder text):
  - [ ] `help` — lists all available commands
  - [ ] `echo` — prints its arguments
  - [ ] `clear` — signals the frontend to clear the screen
  - [ ] `date` — returns current date and time
  - [ ] `whoami` — returns a username (hardcoded for now)
  - [ ] `uname` — returns OS name and version info

### 2.4 — Frontend ↔ Backend Connection
- [ ] In React, replace the local command handler with an `axios` (or `fetch`) call to `POST /command`
- [ ] Show a loading indicator (e.g., spinner after the prompt) while waiting for the server response
- [ ] Display the server's response as a new output line in the terminal
- [ ] Handle network errors gracefully: show a friendly error if the backend is unreachable
- [ ] Add a timeout: if the server takes more than 10 seconds, show `command timed out`

---

## 📋 PHASE 3 — Virtual File System  *(Weeks 6–10)*

> This is the most important and complex part of the OS. You're building a fake file system that lives in memory (and later on disk) on the server.

### 3.1 — File System Data Structure (In-Memory)
- [ ] Design a tree data structure to represent the file system:
  ```
  {
    name: "/",
    type: "directory",
    children: [
      { name: "home", type: "directory", children: [...] },
      { name: "etc", type: "directory", children: [...] }
    ]
  }
  ```
- [ ] Create a `FileSystem` class in the backend with methods: `getNode(path)`, `createFile(path, content)`, `createDir(path)`, `deleteNode(path)`, `moveNode(src, dest)`, `listDir(path)`
- [ ] Initialize the file system with a default structure on server start:
  - `/` (root)
  - `/home/user/` (user home)
  - `/etc/` (config files)
  - `/tmp/` (temp files)
  - `/bin/` (placeholder for binaries)
- [ ] Store the current working directory per-session (start at `/home/user`)

### 3.2 — File System Commands
Implement each of the following commands fully — they must work exactly like their Unix counterparts:

- [ ] **`pwd`** — prints the current working directory path
- [ ] **`ls`** — lists files and directories in the current or specified path
  - [ ] `ls` — basic list
  - [ ] `ls -l` — long format (name, type, size, date)
  - [ ] `ls -a` — include hidden files (names starting with `.`)
  - [ ] `ls -la` — both flags combined
- [ ] **`cd`** — change current directory
  - [ ] `cd /absolute/path` — absolute path navigation
  - [ ] `cd relative/path` — relative path navigation
  - [ ] `cd ..` — go up one directory
  - [ ] `cd ~` — go to home directory
  - [ ] `cd -` — go to the previous directory
- [ ] **`mkdir`** — create a directory
  - [ ] `mkdir dirname` — create a single directory
  - [ ] `mkdir -p a/b/c` — create nested directories
- [ ] **`touch`** — create an empty file or update the timestamp of an existing file
- [ ] **`cat`** — print the contents of a file
  - [ ] `cat filename` — output file content
  - [ ] `cat file1 file2` — concatenate and output multiple files
- [ ] **`echo`** — print text to the terminal
  - [ ] `echo hello world`
  - [ ] `echo "hello world"` — quoted string
  - [ ] `echo $VAR` — print an environment variable (implement later in env section)
- [ ] **`rm`** — remove a file
  - [ ] `rm filename`
  - [ ] `rm -r dirname` — recursively remove a directory
  - [ ] `rm -f filename` — force remove without prompting
- [ ] **`cp`** — copy a file or directory
  - [ ] `cp source dest`
  - [ ] `cp -r sourcedir destdir`
- [ ] **`mv`** — move or rename a file/directory
  - [ ] `mv oldname newname`
  - [ ] `mv file /another/path/`
- [ ] **`find`** — search for files
  - [ ] `find . -name "*.txt"` — find by name
  - [ ] `find /home -type f` — find files only
  - [ ] `find /home -type d` — find directories only
- [ ] **`grep`** — search for text within files
  - [ ] `grep "pattern" filename`
  - [ ] `grep -r "pattern" /path` — recursive search
  - [ ] `grep -i "pattern" filename` — case-insensitive
- [ ] **`head`** — print first N lines of a file (default 10)
- [ ] **`tail`** — print last N lines of a file (default 10)
- [ ] **`wc`** — word count
  - [ ] `wc -l filename` — count lines
  - [ ] `wc -w filename` — count words
  - [ ] `wc -c filename` — count characters

### 3.3 — File Permissions
- [ ] Add `permissions`, `owner`, and `group` fields to each file/directory node
- [ ] Use Unix-style permission strings: `rwxr-xr-x`
- [ ] Implement **`chmod`** — change file permissions
  - [ ] `chmod 755 filename` — numeric mode
  - [ ] `chmod u+x filename` — symbolic mode
- [ ] Implement **`chown`** — change file owner (simulated)
- [ ] Enforce permissions: when a command tries to read/write/execute, check if the current user has permission, and return a `Permission denied` error if not

### 3.4 — File System Persistence
- [ ] Serialize the in-memory file system tree to a JSON file on disk after every write operation
- [ ] Load the file system from this JSON file when the server starts
- [ ] Implement a `save` and `load` mechanism so file system state survives server restarts
- [ ] Add timestamps to every node: `createdAt` and `modifiedAt`
- [ ] Update `modifiedAt` whenever a file is written to

---

## 📋 PHASE 4 — Real-Time Communication with WebSockets  *(Weeks 9–11)*

> Replace the HTTP request/response model with WebSockets for a real terminal feel — instant, streaming output.

### 4.1 — WebSocket Setup
- [ ] Install `socket.io` on the backend and `socket.io-client` on the frontend
- [ ] Replace the `POST /command` HTTP call with a WebSocket event: `emit('command', { input })` from the client
- [ ] On the server, listen for `'command'` events and emit `'output'` events back with the response
- [ ] Handle WebSocket connection and disconnection events — log them on the server
- [ ] Show a small connection status indicator in the UI (green dot = connected, red = disconnected)

### 4.2 — Streaming Output
- [ ] For long-running commands, stream output line-by-line instead of sending everything at once
- [ ] Implement an `'output:stream'` event for line-by-line streaming and `'output:end'` to signal completion
- [ ] The frontend should append each streamed line to the terminal as it arrives
- [ ] Add a `Ctrl+C` keyboard shortcut handler that emits a `'cancel'` event to the server to stop a streaming command
- [ ] Test streaming with the `find` command on a large directory — output should appear line by line

### 4.3 — Session Management
- [ ] Assign a unique session ID to each WebSocket connection
- [ ] Store per-session state on the server: current working directory, environment variables, command history
- [ ] When the client disconnects and reconnects (e.g., refresh), restore the session state if the session ID is still valid
- [ ] Add a session timeout: if a session is idle for 30 minutes, clean it up from the server

---

## 📋 PHASE 5 — Shell Features  *(Weeks 11–14)*

> Add the power features that make a shell actually useful.

### 5.1 — Piping
- [ ] Implement the pipe operator `|` so output of one command becomes input of the next
- [ ] Example: `cat file.txt | grep "hello" | wc -l` should work end-to-end
- [ ] Parse the full command string to detect `|` separators before routing to handlers
- [ ] Each handler in a pipeline receives `stdin` (string) and returns `stdout` (string)
- [ ] Handle errors in pipelines: if one command fails, stop the pipeline and show the error

### 5.2 — Redirection
- [ ] Implement `>` — redirect command output to a file (overwrite)
  - [ ] `echo "hello" > file.txt`
- [ ] Implement `>>` — redirect command output to a file (append)
  - [ ] `echo "world" >> file.txt`
- [ ] Implement `<` — redirect a file's content as input to a command
  - [ ] `grep "hello" < file.txt`
- [ ] Implement `2>` — redirect error output to a file
- [ ] Parse redirection operators before executing commands

### 5.3 — Environment Variables
- [ ] Store a per-session environment variable map: `{ PATH: "/bin:/usr/bin", HOME: "/home/user", USER: "user" }`
- [ ] Implement **`export VAR=value`** — set an environment variable
- [ ] Implement **`unset VAR`** — remove an environment variable
- [ ] Implement **`env`** — list all environment variables
- [ ] Expand `$VAR` references inside any command before execution (e.g., `echo $HOME` → `/home/user`)
- [ ] Expand `~` to the home directory path in file paths

### 5.4 — Tab Completion
- [ ] On pressing `Tab`, attempt to auto-complete the current word in the input
- [ ] If the word is the first word (command name), complete from the list of known commands
- [ ] If the word is a file/directory path, complete from the virtual file system
- [ ] If there is exactly one match, complete immediately
- [ ] If there are multiple matches, show all options below the current input line
- [ ] If there are no matches, do nothing (no bell/beep)

### 5.5 — Command Chaining
- [ ] Implement `&&` — run the second command only if the first succeeds
  - [ ] `mkdir newdir && cd newdir`
- [ ] Implement `||` — run the second command only if the first fails
  - [ ] `cd nonexistent || echo "Directory not found"`
- [ ] Implement `;` — run the second command regardless of first result
  - [ ] `echo "a" ; echo "b"`

### 5.6 — Aliases
- [ ] Implement **`alias`** — create a command alias
  - [ ] `alias ll="ls -la"`
  - [ ] `alias` with no arguments lists all current aliases
- [ ] Implement **`unalias name`** — remove an alias
- [ ] Expand aliases before parsing and executing any command
- [ ] Store aliases in session state

---

## 📋 PHASE 6 — C++ Engine Integration  *(Weeks 12–15)*

> The C++ engine is your secret weapon. Use it for compute-intensive or low-level operations that are better done in native code.

### 6.1 — Engine ↔ Backend Communication
- [ ] Define a clean input/output protocol for the engine: take input via `stdin`, output to `stdout`, errors to `stderr`
- [ ] Use Node's `child_process.spawn()` to launch the C++ engine from the backend
- [ ] Pass command name and arguments to the engine as command-line arguments or via stdin JSON
- [ ] Capture engine output and relay it to the WebSocket client
- [ ] Handle engine crashes gracefully: detect non-zero exit codes and return an error to the user

### 6.2 — Engine-Powered Commands
Implement the following directly in C++ for performance and to demonstrate the language in your stack:

- [ ] **Text processing engine** — a fast line-by-line processor used by `grep`, `sed`, and `awk`-like commands
- [ ] **`sort`** — sort lines of a file alphabetically or numerically
  - [ ] `sort filename`
  - [ ] `sort -r filename` — reverse sort
  - [ ] `sort -n filename` — numeric sort
- [ ] **`uniq`** — filter duplicate adjacent lines
  - [ ] `uniq filename`
  - [ ] `uniq -c` — prefix each line with its occurrence count
- [ ] **`cut`** — extract columns from text
  - [ ] `cut -d"," -f1 file.csv` — cut by delimiter and field number
- [ ] **`awk`** (simplified) — basic column-based text processing
  - [ ] `awk '{print $1}' file.txt` — print first column
- [ ] **`sed`** (simplified) — basic find and replace
  - [ ] `sed 's/old/new/g' file.txt`
- [ ] **A simple calculator** — `calc "3 * (4 + 2)"` evaluates math expressions
- [ ] **`base64`** — encode/decode strings: `base64 encode "hello"` and `base64 decode "aGVsbG8="`

### 6.3 — Engine Build System
- [ ] Write a `Makefile` for the C++ engine with targets: `make`, `make clean`, `make debug`
- [ ] Add compiler flags: `-O2` for release, `-g` for debug, `-Wall -Wextra` for warnings
- [ ] Add the engine build step to the root-level `npm run build` script
- [ ] Document the engine's public interface in `engine/README.md`

---

## 📋 PHASE 7 — User Authentication & Multi-User Support  *(Weeks 14–16)*

> Turn the single-user prototype into a real multi-user system.

### 7.1 — User Accounts
- [ ] Set up a SQLite database in the backend using `better-sqlite3`
- [ ] Create a `users` table with columns: `id`, `username`, `password_hash`, `home_dir`, `created_at`
- [ ] Hash passwords using `bcrypt` — never store plain-text passwords
- [ ] Create a default `root` user and a default `guest` user on first startup
- [ ] Implement **`adduser username`** — create a new user (only root can do this)
- [ ] Implement **`passwd`** — change the current user's password
- [ ] Implement **`su username`** — switch to another user (requires their password or root access)
- [ ] Implement **`users`** — list all registered users

### 7.2 — Login System
- [ ] Create a login screen that appears before the terminal: ask for username and password
- [ ] On login, verify credentials against the database and start a session
- [ ] Issue a JWT token on successful login and store it in the client (memory or `sessionStorage`)
- [ ] Attach the JWT to every WebSocket connection and verify it on the server
- [ ] Implement **`logout`** — ends the current session and shows the login screen

### 7.3 — Per-User File System
- [ ] Each user gets their own home directory `/home/username/` in the virtual file system
- [ ] Files and directories have an `owner` field tied to a user
- [ ] Enforce ownership: only the owner (or root) can delete/modify their files
- [ ] Root user can access all files in the system
- [ ] `whoami` now returns the actual logged-in username

### 7.4 — Sudo / Privilege Escalation
- [ ] Implement **`sudo command`** — run a command as root (prompts for the user's own password)
- [ ] Add a `sudoers` list (stored in the database) of users who are allowed to use `sudo`
- [ ] Commands that require root: `adduser`, `chown`, accessing `/etc/` files, etc.
- [ ] Log all `sudo` usage with username, command, and timestamp

---

## 📋 PHASE 8 — Process Management  *(Weeks 15–17)*

> Simulate a real OS process system.

### 8.1 — Process Table
- [ ] Create a `ProcessManager` class on the backend with a process table (in-memory map)
- [ ] Each process has: `pid`, `command`, `args`, `status` (`running | sleeping | stopped | zombie`), `owner`, `startedAt`, `cpuUsage`, `memUsage` (simulated random values)
- [ ] When a command is executed, create a process entry for it and remove it when done
- [ ] Implement **`ps`** — show currently running processes
  - [ ] `ps` — processes for the current user
  - [ ] `ps aux` — all processes for all users (root only)

### 8.2 — Background Jobs
- [ ] Implement **`&`** at the end of a command to run it in the background
  - [ ] `sleep 10 &` — runs sleep in the background, immediately returns to the prompt
- [ ] Implement **`jobs`** — list all background jobs in the current session
- [ ] Implement **`fg %1`** — bring a background job to the foreground
- [ ] Implement **`bg %1`** — resume a stopped job in the background
- [ ] Implement `Ctrl+Z` to suspend the foreground job

### 8.3 — Signals & Kill
- [ ] Implement **`kill PID`** — terminate a process by PID
- [ ] Implement **`kill -9 PID`** — force kill
- [ ] Implement **`killall processname`** — kill all processes with that name
- [ ] Implement **`sleep N`** — a command that waits N seconds (good for testing background jobs)

---

## 📋 PHASE 9 — Networking Commands  *(Weeks 16–18)*

> Add internet-aware commands that make your OS feel connected.

### 9.1 — HTTP Commands
- [ ] Implement **`curl URL`** — make an HTTP GET request to a URL and display the response body
  - [ ] `curl https://api.example.com/data`
  - [ ] `curl -X POST -d "body" URL` — POST request with a body
  - [ ] `curl -H "Authorization: Bearer token" URL` — with a custom header
- [ ] Implement **`wget URL`** — download a file from a URL and save it to the current directory
- [ ] Both commands are executed on the backend (the server makes the request, not the browser)

### 9.2 — Network Info Commands
- [ ] Implement **`ping hostname`** — send a ping and report latency (use backend to actually ping)
- [ ] Implement **`ifconfig`** — show simulated network interface info (IP, MAC address)
- [ ] Implement **`netstat`** — show simulated active connections
- [ ] Implement **`nslookup domain`** — resolve a domain to an IP address (real DNS lookup on backend)
- [ ] Implement **`whois domain`** — fetch WHOIS info for a domain

### 9.3 — Package Manager (Simulated)
- [ ] Implement a fake package manager: **`pkg`** or **`apt`**
  - [ ] `pkg install cowsay` — "installs" a package (adds it to an installed list)
  - [ ] `pkg remove cowsay` — removes a package
  - [ ] `pkg list` — lists installed packages
  - [ ] `pkg search term` — searches available packages
- [ ] A few "installed" packages should actually do something:
  - [ ] `cowsay "hello"` — outputs ASCII art of a cow saying the message
  - [ ] `fortune` — outputs a random quote
  - [ ] `figlet "text"` — outputs large ASCII text

---

## 📋 PHASE 10 — Shell Scripting  *(Weeks 17–19)*

> Let users write and execute shell scripts — the culmination of all your shell features.

### 10.1 — Script Execution
- [ ] Implement **`sh filename.sh`** or **`./filename.sh`** — execute a shell script file
- [ ] Read the file line by line and execute each line as a command
- [ ] Scripts should support all previously implemented features: piping, redirection, variables, etc.

### 10.2 — Control Flow
- [ ] Implement **`if / then / else / fi`** blocks in scripts:
  ```sh
  if [ "$x" = "hello" ]; then
    echo "it's hello"
  else
    echo "it's not hello"
  fi
  ```
- [ ] Implement **`for` loops**:
  ```sh
  for i in 1 2 3; do
    echo $i
  done
  ```
- [ ] Implement **`while` loops**:
  ```sh
  while [ $i -lt 10 ]; do
    echo $i
    i=$((i+1))
  done
  ```

### 10.3 — Script Variables & Functions
- [ ] Support variable assignment in scripts: `x=5`
- [ ] Support arithmetic: `result=$((x + 3))`
- [ ] Support function definitions:
  ```sh
  greet() {
    echo "Hello, $1"
  }
  greet "World"
  ```
- [ ] Support `$1`, `$2`, ... `$@` for script arguments
- [ ] Support exit codes: `exit 0` (success), `exit 1` (failure)
- [ ] Implement **`[ condition ]`** test expressions:
  - [ ] `-f file` — file exists
  - [ ] `-d dir` — directory exists
  - [ ] `"$a" = "$b"` — string equality
  - [ ] `-lt`, `-gt`, `-eq`, `-ne` — numeric comparisons

---

## 📋 PHASE 11 — Advanced UI & UX Features  *(Weeks 18–20)*

> Polish the front-end into something that looks and feels incredible.

### 11.1 — Multiple Terminal Tabs
- [ ] Add the ability to open multiple terminal sessions in tabs (like a browser)
- [ ] Each tab has its own independent session (its own CWD, history, env variables)
- [ ] Implement `Ctrl+T` to open a new tab and `Ctrl+W` to close the current one
- [ ] Show tab titles that update to reflect the current directory

### 11.2 — Split Panes
- [ ] Allow splitting the terminal horizontally or vertically (like tmux)
- [ ] Each pane is an independent terminal session
- [ ] Implement keyboard shortcuts to switch focus between panes

### 11.3 — Themes & Customization
- [ ] Create at least 5 built-in color themes:
  - [ ] Dark (default — black bg, green text)
  - [ ] Light (white bg, dark text)
  - [ ] Dracula (purple/pink palette)
  - [ ] Solarized Dark
  - [ ] Monokai
- [ ] Implement **`theme list`** — show all available themes
- [ ] Implement **`theme set dracula`** — switch to a theme immediately
- [ ] Let users customize the prompt format via an environment variable: `PS1`
- [ ] Add font size controls: `Ctrl++` to increase, `Ctrl+-` to decrease

### 11.4 — File Explorer Sidebar (Optional but Impressive)
- [ ] Add a collapsible sidebar showing the virtual file system tree
- [ ] Clicking a file in the sidebar runs `cat` on it in the terminal
- [ ] Clicking a folder in the sidebar runs `cd` on it
- [ ] The sidebar updates in real-time as the file system changes

### 11.5 — Search in Terminal Output
- [ ] Implement `Ctrl+F` to open a search bar within the terminal output
- [ ] Highlight all matches in the output
- [ ] Allow navigating between matches with `Enter` / `Shift+Enter`

---

## 📋 PHASE 12 — Text Editor  *(Weeks 19–20)*

> Every real OS needs a text editor. Build one that runs inside the terminal.

### 12.1 — Basic Editor
- [ ] Implement **`nano filename`** (or **`edit filename`**) — opens a full-screen editor inside the terminal
- [ ] The editor takes over the entire terminal display while open
- [ ] Show the file content as editable text in the center
- [ ] Show a toolbar at the bottom with keyboard shortcuts: `Ctrl+S` to save, `Ctrl+X` to exit, `Ctrl+G` for help
- [ ] On save, write the content back to the virtual file system

### 12.2 — Editor Features
- [ ] Line numbers on the left side
- [ ] Display the filename and modification status (`*` if unsaved changes) in the top bar
- [ ] `Ctrl+W` to search within the editor
- [ ] `Ctrl+\` to find and replace
- [ ] Syntax highlighting for `.js`, `.py`, `.sh`, `.json`, `.md`, `.cpp` files (implement at least 2)
- [ ] Show cursor position (line and column) in the status bar

---

## 📋 PHASE 13 — System Monitor & Dashboard  *(Week 20)*

> Make the OS feel alive with real-time system stats.

### 13.1 — System Commands
- [ ] Implement **`top`** — an interactive real-time process viewer (updates every second)
  - [ ] Shows: PID, USER, CPU%, MEM%, TIME, COMMAND
  - [ ] Press `q` to quit
  - [ ] Press `k` then a PID to kill a process from within top
- [ ] Implement **`df`** — show disk usage of the virtual file system
  - [ ] Shows: filesystem, total size, used, available, use%, mountpoint
- [ ] Implement **`du path`** — show disk usage of a specific directory (recursively calculates size)
- [ ] Implement **`free`** — show simulated memory usage (total, used, free, cached)
- [ ] Implement **`uptime`** — show how long the server has been running and server load

### 13.2 — Dashboard (`htop`-style)
- [ ] Implement **`htop`** — a rich, full-screen system monitor with:
  - [ ] CPU usage bar (simulated)
  - [ ] Memory usage bar (simulated)
  - [ ] Process table with sortable columns
  - [ ] Color-coded resource usage
  - [ ] Press `F10` or `q` to quit

---

## 📋 PHASE 14 — Testing & Code Quality  *(Ongoing, especially Weeks 18–21)*

> A project is only as good as its tests. This is what separates a side project from a professional one.

### 14.1 — Backend Tests
- [ ] Set up Jest for the backend
- [ ] Write unit tests for the command parser (edge cases, special characters, pipes, flags)
- [ ] Write unit tests for every file system method (create, delete, move, copy, permissions)
- [ ] Write unit tests for every individual command handler
- [ ] Write integration tests for the WebSocket command flow end-to-end
- [ ] Achieve at least 70% code coverage
- [ ] Add a `npm run test` script and run it in CI

### 14.2 — Frontend Tests
- [ ] Set up React Testing Library
- [ ] Write tests for the terminal component: renders correctly, handles input, displays output
- [ ] Write tests for the command history navigation (up/down arrows)
- [ ] Write tests for tab completion
- [ ] Add `npm run test` to the frontend

### 14.3 — Engine Tests
- [ ] Write C++ unit tests using a framework like Google Test or simple assertions
- [ ] Test each engine command with known inputs and expected outputs
- [ ] Add engine tests to the build pipeline

---

## 📋 PHASE 15 — Deployment & DevOps  *(Weeks 20–22)*

> Get it live on the internet. A project that only runs on localhost is invisible to recruiters.

### 15.1 — Dockerization
- [ ] Write a `Dockerfile` for the backend
- [ ] Write a `Dockerfile` for the frontend
- [ ] Write a `docker-compose.yml` that starts both services with one command: `docker compose up`
- [ ] Add a multi-stage build for the frontend to minimize image size
- [ ] Test that the Dockerized app works exactly like the local version

### 15.2 — CI/CD Pipeline
- [ ] Set up GitHub Actions with a workflow file (`.github/workflows/ci.yml`)
- [ ] On every push to `dev`: run lint, run tests, report results
- [ ] On every merge to `main`: run lint, run tests, build Docker images, and deploy
- [ ] Add a status badge to the top of this README showing the current CI status

### 15.3 — Cloud Deployment
- [ ] Deploy the backend to a cloud provider (Railway, Render, or a VPS)
- [ ] Deploy the frontend to Vercel or Netlify
- [ ] Set up a custom domain (even a free one like `your-name.up.railway.app`)
- [ ] Set up HTTPS — all traffic must be encrypted
- [ ] Add environment variable management on the deployment platform (no hardcoded secrets)
- [ ] Add a health check URL that monitoring services can ping

### 15.4 — Monitoring & Logging
- [ ] Add structured logging on the backend using `winston` or `pino` (JSON format)
- [ ] Log every command execution: timestamp, session ID, user, command, execution time, success/failure
- [ ] Set up basic uptime monitoring (e.g., UptimeRobot — it's free) to alert you if the server goes down
- [ ] Add error tracking (e.g., Sentry free tier) to catch runtime errors in production

---

## 📋 PHASE 16 — Final Polish & Resume Banger Features  *(Weeks 21–22)*

> These are the wow features that make someone look at your GitHub and say "this is real."

### 16.1 — Multiplayer / Collaborative Mode
- [ ] Allow two users to join the same terminal session and see each other's input/output in real-time
- [ ] Show a colored username label next to each command so you can tell who typed what
- [ ] Implement **`share`** — generates a shareable session URL
- [ ] Implement **`who`** — shows who else is currently logged into the system

### 16.2 — AI Assistant Command
- [ ] Implement **`ask "question"`** — sends a question to an AI API (OpenAI/Anthropic) and prints the response in the terminal
- [ ] Implement **`explain command`** — explains what a shell command does using the AI
- [ ] Implement **`fix`** (after a failed command) — asks the AI to suggest what went wrong
- [ ] Show a spinning loader while waiting for the AI response

### 16.3 — Startup Script & `.profile`
- [ ] On login, automatically run `/home/user/.profile` if it exists
- [ ] Users can customize their prompt, set aliases, and export variables in `.profile`
- [ ] Show a custom welcome message defined in `.profile`

### 16.4 — Easter Eggs & Fun
- [ ] Implement **`matrix`** — displays a Matrix-style raining green characters animation in the terminal
- [ ] Implement **`rickroll`** — you know what to do
- [ ] Implement **`banner`** — displays the WEB-CLI-OS ASCII art logo
- [ ] `sudo make me a sandwich` should work (Obligatory XKCD reference)
- [ ] Implement **`sl`** — a train rolls across the terminal when you mistype `ls` (punishes typos)

### 16.5 — Documentation
- [ ] Write a full user manual: `man commandname` — displays the manual page for any command
- [ ] Each man page should document: name, synopsis, description, options/flags, examples
- [ ] Implement **`man`** — the command to read manual pages from within the terminal
- [ ] Write developer documentation explaining the architecture, how to add new commands, and how the engine works
- [ ] Record a demo video or GIF of the OS in action and embed it at the top of this README

---

## 🏁 COMPLETION CHECKLIST

Before calling this project done, make sure all of the following are true:

- [ ] All Phase 0–10 checkboxes are checked (core features)
- [ ] The app is deployed and accessible via a public URL
- [ ] The GitHub repo has a great README with a demo GIF, setup instructions, feature list, and architecture diagram
- [ ] CI/CD is passing (green badge on the README)
- [ ] All commands are documented with `man`
- [ ] The codebase has at least 70% test coverage
- [ ] No hardcoded secrets in the codebase (checked with `git log` and `trufflesecurity/trufflehog`)
- [ ] The project handles all major error cases gracefully — no unhandled crashes
- [ ] At least one "wow" feature from Phase 16 is implemented

---

## 👥 Team

| Member | Role |
|--------|------|
| TBD | Frontend Lead |
| TBD | Backend Lead |
| TBD | Engine (C++) Lead |
| TBD | DevOps / Deployment Lead |

---

## 📅 Timeline Overview

| Phase | Focus | Target Timeline |
|-------|-------|----------------|
| Phase 0 | Setup & Workflow | Week 1 |
| Phase 1 | Terminal UI | Weeks 2–4 |
| Phase 2 | Backend & Commands | Weeks 4–6 |
| Phase 3 | Virtual File System | Weeks 6–10 |
| Phase 4 | WebSockets | Weeks 9–11 |
| Phase 5 | Shell Features | Weeks 11–14 |
| Phase 6 | C++ Engine | Weeks 12–15 |
| Phase 7 | Auth & Multi-User | Weeks 14–16 |
| Phase 8 | Process Management | Weeks 15–17 |
| Phase 9 | Networking Commands | Weeks 16–18 |
| Phase 10 | Shell Scripting | Weeks 17–19 |
| Phase 11 | Advanced UI | Weeks 18–20 |
| Phase 12 | Text Editor | Weeks 19–20 |
| Phase 13 | System Monitor | Week 20 |
| Phase 14 | Testing | Ongoing |
| Phase 15 | Deployment & CI/CD | Weeks 20–22 |
| Phase 16 | Polish & Extras | Weeks 21–22 |

---

> *Built with 🔥 by a team of 4 over 4–5 months. Every checkbox checked is one step closer to something legendary.*