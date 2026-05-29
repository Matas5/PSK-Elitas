@echo off
rem Run this ONCE if you received the project as a zip from a Mac/Linux machine.
rem node_modules carry OS-specific binaries (Vite/esbuild), so they must be reinstalled
rem fresh on Windows. This wipes them plus the backend build output, then reinstalls.
cd /d "%~dp0.."

echo Removing OS-specific dependencies and stale build output...
if exist frontend\node_modules     rmdir /s /q frontend\node_modules
if exist auth-server\node_modules  rmdir /s /q auth-server\node_modules
if exist backend\target            rmdir /s /q backend\target

echo Installing frontend dependencies...
cmd /c "cd frontend && npm install"
echo Installing auth-server dependencies...
cmd /c "cd auth-server && npm install"

echo.
echo Clean install done. Now run launch.bat.
pause
