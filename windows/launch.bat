@echo off
rem PSK-Elitas one-shot launcher for Windows.
rem Starts Postgres (Docker), backend, auth server and frontend, then opens the browser.
rem All localhost routing is handled by the Vite dev server proxy on port 5173.
cd /d "%~dp0.."

echo ============================================
echo    PSK-Elitas - Windows launcher
echo ============================================
echo.

set MISSING=
where java   >nul 2>nul || (echo [MISSING] Java 17 JDK. Install Temurin 17 and set JAVA_HOME. & set MISSING=1)
where node   >nul 2>nul || (echo [MISSING] Node.js 22. Install from nodejs.org. & set MISSING=1)
where docker >nul 2>nul || (echo [MISSING] Docker Desktop. Install it and make sure it is running. & set MISSING=1)
if defined MISSING (
  echo.
  echo Install the tool s listed above, then run launch.bat again.
  pause
  exit /b 1
)

echo Starting PostgreSQL via Docker...
docker compose up -d postgres
if errorlevel 1 (
  echo.
  echo Could not start Postgres. Start Docker Desktop first, then re-run launch.bat.
  pause
  exit /b 1
)

echo Starting backend   on http://localhost:8081 ...
start "PSK Backend"  cmd /k "cd backend && mvnw.cmd -Dmaven.test.skip=true spring-boot:run"

echo Starting auth      on http://localhost:3000 ...
start "PSK Auth"     cmd /k "cd auth-server && npm install && npm run dev"

echo Starting frontend  on http://localhost:5173 ...
start "PSK Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Waiting ~30 seconds for everything to boot, then opening the browser...
timeout /t 30 /nobreak >nul
start "" http://localhost:5173

echo.
echo ============================================
echo    Open:  http://localhost:5173
echo    Login: demo / demo1234   (also demo_employee / demo1234)
echo    Stop:  run windows\stop.bat  or close the 3 PSK windows
echo ============================================
echo.
echo This window can be closed. The three PSK windows keep the app running.
pause
