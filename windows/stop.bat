@echo off
rem Stops everything launch.bat started.
cd /d "%~dp0.."

echo Stopping PostgreSQL...
docker compose down

echo Closing service windows...
taskkill /FI "WINDOWTITLE eq PSK Backend*"  /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq PSK Auth*"     /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq PSK Frontend*" /T /F >nul 2>nul

echo Done.
pause
