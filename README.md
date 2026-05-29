# Risk monitoring system



## !!! Disclaimer: you need a `.env` !!!

A `.env` file at the project root, following the committed `.env.example` pattern, is required.
It holds the secrets the auth server uses (Google OAuth 2.0 client id/secret, session secret).

Without it, local login (`demo` / pass:`demo1234` and `demo_employee` / pass:`demo1234`)  still works, but the auth server and Google
sign-in will not. `.env` is gitignored, so it never ships in the repo; get the shared developer secrets from official team members of the project. 

## Users list
| Demo user name               | Password                                 |
|--------------------|---------------------------------------|
| demo           | demo1234                 | 
| demo_employee     | demo1234      |

## What lives where at runtime

| Service     | URL                     | Source               |
|-------------|-------------------------|----------------------|
| Frontend    | http://localhost:5173   | `frontend/`          |
| Backend     | http://localhost:8081   | `backend/`           |
| Auth server | http://localhost:3000   | `auth-server/`       |
| PostgreSQL  | localhost:5433          | `docker-compose.yml` |

---

## Launch with VS Code (Dev Container)

1. Open the project folder in VS Code.
2. Run **"Dev Containers: Reopen in Container"** 
3. In the VS Code terminal run the launcher:

   ```bash
   bash .devcontainer/launch.sh
   ```

   It starts Postgres, backend, auth server and frontend together (Ctrl-C stops all). When
   VS Code says port 5173 is forwarded, open **http://localhost:5173** and log in with
   `demo` / `demo1234`.

---

## Health checks

| What               | URL                                   | Expected |
|--------------------|---------------------------------------|----------|
| Frontend           | http://localhost:5173                 | UI loads |
| Backend health     | http://localhost:8081/api/health      | `OK`     |
| Auth server config | http://localhost:3000/debug/config    | JSON     |

PostgreSQL (dev only): database `risk_monitor`, user `dev_user`, password `dev_password`,
host port `5433`.

---

## Launching on Linux

**Dependencies** (Download with your Distro dependency manager) :

- `openjdk-17-jdk`
- Node.js 22 + npm
- `docker` 
- `docker-compose`
- `git`


**Run properly**:
Run the following either in seperate terminals (3 in total: backend+postgre, auth, frontend) or batch as one command and run:
```bash
docker compose up -d postgres
cd backend && ./mvnw -Dmaven.test.skip=true spring-boot:run
cd auth-server && npm install && npm run dev
cd frontend && npm install && npm run dev
```

**One-line run**:
The following also works, but is worse when it comes to live sysmtem monitoring
```bash
docker compose up -d --build
```

**Stop**:

```bash
docker compose down; pkill -f spring-boot:run; pkill -f vite; pkill -f authServer
```

---

## Launch with Nix (SUPER AWESOME PERSON)

If you have [Nix: the package manager](https://nixos.org/download/), a `shell.nix` ships two commands: `fresh` (clean build then launch) and
`start` (just launch). They bring up Postgres, backend, auth server and frontend together.


First time: wipe stale build output, reinstall, recompile, launch:
```bash
nix-shell --run fresh 
nix-shell --run start
```

Also, ff Nix has no nixpkgs channel configured, point it at one inline:
```bash
nix-shell -I nixpkgs=channel:nixos-25.11 --run fresh
```

**Stop**: press `Ctrl-C` in that terminal.
