#!/bin/bash
echo "🤖 Starting LinkedIn Auto Apply..."
echo ""

# Start backend
echo "▶ Starting backend (port 3001)..."
cd "$(dirname "$0")/backend" && node server.js &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start frontend
echo "▶ Starting frontend (port 5173)..."
cd "$(dirname "$0")/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ App running at: http://localhost:5173"
echo "   Backend API:    http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and catch Ctrl+C
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
