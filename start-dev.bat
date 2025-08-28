@echo off
REM Open-Deep-Coder Development Startup Script for Windows
REM This script starts both the backend and frontend in development mode

echo 🚀 Starting Open-Deep-Coder Development Environment
echo =================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js/npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Python and Node.js are available
echo.

REM Install backend dependencies if needed
echo 📦 Installing backend dependencies...
cd backend
if not exist \"requirements.txt\" (
    echo ❌ requirements.txt not found in backend directory
    pause
    exit /b 1
)

python -m pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Some backend dependencies may have failed to install, but continuing...
) else (
    echo ✅ Backend dependencies installed
)
cd ..

REM Install frontend dependencies if needed
echo 📦 Installing frontend dependencies...
if not exist \"package.json\" (
    echo ❌ package.json not found
    pause
    exit /b 1
)

npm install >nul 2>&1
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
) else (
    echo ✅ Frontend dependencies installed
)

echo.
echo 🔧 Starting development servers...
echo.

REM Start backend in background
echo 🐍 Starting backend server on http://127.0.0.1:8000
cd backend
start /b python test_server.py > ..\\backend.log 2>&1
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo ⚛️  Starting frontend server on http://localhost:1420
echo.
echo 🎉 Open-Deep-Coder is starting!
echo =================================================
echo 🌐 Frontend: http://localhost:1420
echo 🔧 Backend:  http://127.0.0.1:8000
echo 📊 Health:   http://127.0.0.1:8000/health
echo 📋 API Docs: http://127.0.0.1:8000/docs
echo.
echo 📖 Features Available:
echo    ✅ File Explorer (browse and open files)
echo    ✅ Monaco Editor (with syntax highlighting)
echo    ✅ AI Chat (mock responses for now)
echo    ✅ Multi-theme support (4 variants)
echo    ✅ Agent status indicators
echo    ✅ Terminal panel
echo.
echo 🔧 To add LLM integration:
echo    1. Get an OpenRouter API key from https://openrouter.ai/
echo    2. Install Ollama from https://ollama.ai/
echo    3. Create a .env file from .env.example
echo    4. Add your API keys to the .env file
echo.
echo Press Ctrl+C to stop servers when done
echo.

REM Start frontend (this will block until closed)
npm run dev

echo.
echo 🛑 Frontend stopped. Backend may still be running.
echo Check Task Manager if you need to stop the backend manually.
pause