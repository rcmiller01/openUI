#!/bin/bash

# Open-Deep-Coder Development Startup Script
# This script starts both the backend and frontend in development mode

echo \"🚀 Starting Open-Deep-Coder Development Environment\"
echo \"=================================================\"
echo \"\"

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo \"❌ Python is not installed or not in PATH\"
    exit 1
fi

# Check if Node.js is available
if ! command -v npm &> /dev/null; then
    echo \"❌ Node.js/npm is not installed or not in PATH\"
    exit 1
fi

echo \"✅ Python and Node.js are available\"
echo \"\"

# Install backend dependencies if needed
echo \"📦 Installing backend dependencies...\"
cd backend
if [ ! -f \"requirements.txt\" ]; then
    echo \"❌ requirements.txt not found in backend directory\"
    exit 1
fi

python -m pip install -r requirements.txt > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo \"✅ Backend dependencies installed\"
else
    echo \"⚠️  Some backend dependencies may have failed to install, but continuing...\"
fi
cd ..

# Install frontend dependencies if needed
echo \"📦 Installing frontend dependencies...\"
if [ ! -f \"package.json\" ]; then
    echo \"❌ package.json not found\"
    exit 1
fi

npm install > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo \"✅ Frontend dependencies installed\"
else
    echo \"❌ Failed to install frontend dependencies\"
    exit 1
fi

echo \"\"
echo \"🔧 Starting development servers...\"
echo \"\"

# Start backend in background
echo \"🐍 Starting backend server on http://127.0.0.1:8000\"
cd backend
python test_server.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://127.0.0.1:8000/health > /dev/null; then
    echo \"✅ Backend server is running\"
else
    echo \"❌ Backend server failed to start\"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend in background
echo \"⚛️  Starting frontend server on http://localhost:1420\"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo \"\"
echo \"🎉 Open-Deep-Coder is now running!\"
echo \"=================================================\"
echo \"🌐 Frontend: http://localhost:1420\"
echo \"🔧 Backend:  http://127.0.0.1:8000\"
echo \"📊 Health:   http://127.0.0.1:8000/health\"
echo \"📋 API Docs: http://127.0.0.1:8000/docs\"
echo \"\"
echo \"📖 Features Available:\"
echo \"   ✅ File Explorer (browse and open files)\"
echo \"   ✅ Monaco Editor (with syntax highlighting)\"
echo \"   ✅ AI Chat (mock responses for now)\"
echo \"   ✅ Multi-theme support (4 variants)\"
echo \"   ✅ Agent status indicators\"
echo \"   ✅ Terminal panel\"
echo \"\"
echo \"🔧 To add LLM integration:\"
echo \"   1. Get an OpenRouter API key from https://openrouter.ai/\"
echo \"   2. Install Ollama from https://ollama.ai/\"
echo \"   3. Create a .env file from .env.example\"
echo \"   4. Add your API keys to the .env file\"
echo \"\"
echo \"Press Ctrl+C to stop all servers\"
echo \"\"

# Function to cleanup on exit
cleanup() {
    echo \"\"
    echo \"🛑 Shutting down servers...\"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo \"✅ Cleanup complete\"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
echo \"📋 Monitoring logs (Ctrl+C to stop):\"
echo \"\"
tail -f backend.log frontend.log &
TAIL_PID=$!

# Wait for user interrupt
wait

# Cleanup tail process
kill $TAIL_PID 2>/dev/null
cleanup