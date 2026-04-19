@echo off
title FlowAI - Startup
echo.
echo  ⚡  FlowAI ^| AI Workflow Automation Platform
echo  ─────────────────────────────────────────────
echo.

:: Kill any stale node process on port 3002
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3002 " ^| findstr "LISTENING"') do (
    echo  Clearing port 3002 ^(PID %%a^)...
    taskkill /PID %%a /F >nul 2>&1
)

echo  → Starting backend on :3002...
start "FlowAI Backend" /min cmd /c "cd /d %~dp0backend && node src/index.js"

timeout /t 2 /nobreak >nul

echo  → Starting frontend on :5173...
start "FlowAI Frontend" /min cmd /c "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  ✅  FlowAI is running!
echo.
echo     Frontend : http://localhost:5173  (or 5174 if 5173 is taken)
echo     Backend  : http://localhost:3002/api/health
echo.
echo  Add your Anthropic API key to backend\.env to enable AI steps:
echo     ANTHROPIC_API_KEY=sk-ant-api03-...
echo.
pause
