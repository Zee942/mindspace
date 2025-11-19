@echo off
echo ========================================
echo   Mind Space Backend Server
echo ========================================
echo.

cd backend

:: Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate

:: Install dependencies
echo Installing dependencies...
pip install -q -r requirements.txt

:: Run server
echo.
echo Starting FastAPI server...
echo Backend running at: http://localhost:8000
echo API Docs at: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --reload-dir app --port 8000
