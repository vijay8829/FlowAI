#!/bin/bash
# Start FlowAI - AI Workflow Automation Platform

echo ""
echo "  ⚡ FlowAI — AI Workflow Automation Platform"
echo "  ─────────────────────────────────────────────"

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ] && [ -f "backend/.env" ]; then
  export $(grep -v '^#' backend/.env | xargs)
fi

if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_api_key_here" ]; then
  echo "  ⚠️  ANTHROPIC_API_KEY not set — AI steps will fail"
  echo "  Set it in backend/.env or export ANTHROPIC_API_KEY=sk-ant-..."
  echo ""
fi

# Start backend
echo "  → Starting backend on :3001"
cd backend && npm start &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "  → Starting frontend on :5173"
cd ../frontend && npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "  ✅ FlowAI is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "  Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
wait
