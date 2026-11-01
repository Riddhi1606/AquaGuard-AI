<#
AquaGuard AI — One-Click Windows Development Startup Script
Starts FastAPI backend on http://localhost:8000 and Vite frontend on http://localhost:5173
#>

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     AquaGuard AI — Smart City Flood Early Warning" -ForegroundColor Cyan
Write-Host "                Pilot City: Jaipur, India" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Update PATH to include Node.js
$env:PATH = "C:\Program Files\nodejs;" + [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

# 2. Check virtual environment
if (-not (Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment in .\venv..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\pip.exe install -r backend\requirements.txt
}

# 3. Check trained model
if (-not (Test-Path ".\ml_engine\saved_models\flood_model.joblib")) {
    Write-Host "Training ML flood risk models..." -ForegroundColor Yellow
    .\venv\Scripts\python.exe ml_engine\training\train_models.py
}

# 4. Initialize Database
Write-Host "Initializing & seeding database..." -ForegroundColor Yellow
.\venv\Scripts\python.exe backend\app\database\init_db.py

Write-Host ""
Write-Host "Starting Backend on http://localhost:8000 (Swagger docs: http://localhost:8000/docs)" -ForegroundColor Green
Write-Host "Starting Frontend on http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate both processes." -ForegroundColor Gray
Write-Host ""

# Launch backend in separate background job
$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    & ".\venv\Scripts\uvicorn.exe" backend.app.main:app --host 127.0.0.1 --port 8000
} -ArgumentList $PSScriptRoot\..

# Launch frontend in foreground
Set-Location "$PSScriptRoot\..\frontend"
& "C:\Program Files\nodejs\npm.cmd" run dev

# Cleanup on exit
Stop-Job $backendJob
Remove-Job $backendJob
