@echo off
echo Starting FoodTrack AI...
echo.
echo [1] Starting Backend on port 8000...
start "FoodTrack Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"
timeout /t 3 >nul
echo [2] Starting Frontend on port 5173...
start "FoodTrack Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 4 >nul
echo.
echo ✅ FoodTrack AI is running!
echo    App: http://localhost:5173
echo    API: http://localhost:8000/docs
echo.
start http://localhost:5173
pause
