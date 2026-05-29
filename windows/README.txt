PSK-Elitas on Windows
=====================

What you need installed first (one time):
  1. Java 17 JDK     - Eclipse Temurin 17, and set JAVA_HOME.   https://adoptium.net
  2. Node.js 22 LTS  - includes npm.                            https://nodejs.org
  3. Docker Desktop  - install it and make sure it is RUNNING.  https://docker.com
launch.bat checks for these and tells you if one is missing.

How to run:
  - If you got this project as a .zip from a Mac or Linux machine:
      double-click  windows\clean-install.bat   ONCE first
      (it reinstalls the dependencies for Windows; the originals are OS-specific).
  - Then double-click  windows\launch.bat
  - Wait about 30 seconds. A browser opens at  http://localhost:5173
    (if it does not, open that address yourself; use "localhost", not 127.0.0.1).

Log in:
  demo / demo1234            (main demo account, comes with seeded data)
  demo_employee / demo1234   (second account, shares a team with demo)
Local login needs no Google. Google sign-in is optional and uses the auth server.

To stop:
  double-click  windows\stop.bat   (or just close the three "PSK ..." windows).

How the pieces fit (all on your machine):
  - Postgres database  -> Docker container on port 5433
  - Backend (Spring)   -> http://localhost:8081
  - Auth server (Node) -> http://localhost:3000   (only needed for Google login)
  - Frontend (Vite)    -> http://localhost:5173   <- open this one
  The frontend forwards /api to the backend and /auth, /user to the auth server,
  so everything works through http://localhost:5173 with no extra setup.

Troubleshooting:
  - "Could not start Postgres" -> Docker Desktop is not running. Start it, re-run.
  - Backend window shows a port error -> something else uses 8081/5173/3000; close it.
  - Google button does nothing -> the auth server or its .env is missing; local login
    still works, so just use demo / demo1234.
  - First backend start is slow (downloads Maven + dependencies); later starts are fast.
