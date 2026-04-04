# WEB-CLI-OS

A web-based command line operating system with React frontend and Node.js backend.

## Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- C++ compiler (for the engine)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd WEB-CLI-OS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Engine Setup**
   ```bash
   cd ../engine
   # Compile the C++ engine (assuming g++ is available)
   g++ main.cpp -o main.exe
   ```

### Running the Application

1. **Start Backend** (from backend directory)
   ```bash
   npm run dev
   ```

2. **Start Frontend** (from frontend directory)
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGIN`: Frontend URL for CORS (default: http://localhost:3000)

### Frontend (.env.local)
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:5000)
- `REACT_APP_NODE_ENV`: Environment mode