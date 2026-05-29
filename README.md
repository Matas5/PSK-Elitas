<p align="center">
  <img src="frontend/public/favicon.svg" alt="Risk monitoring system" width="120" />
</p>

<h1 align="center">Risk Monitoring System</h1>
<h2 align="center"><b>Bare-bones risk category, value, graphing rish detection system (+with color-coding)! </b></h2>

# Getting started 

## Launch with VS Code (Dev Container)

You need: Docker Desktop, VS Code, and the **Dev Containers** extension inside of Visual Studio Code.

1. Start Docker Desktop (wait until it says the engine is running).
2. Open the project folder in VS Code.
3. `Ctrl+Shift+P` -> **">Dev Containers: Reopen in Container"**. (Note: first build might take a little while :< )
4. Open a terminal in the container  and launch everything:

   ```bash
   bash .devcontainer/launch.sh
   ```

   This brings up all the stuff.
5. When VS Code says port 5173 is forwarded, open **http://localhost:5173** and you are ready to login.


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

## Google Auth
> [!warning]
> !!! Disclaimer: you need a `.env` FOR GOOGLE AUTH !!!
>
> A `.env` file at the project root, following the committed `.env.example` pattern, is required.
> It holds the secrets the auth server uses (Google OAuth 2.0 client id/secret, session secret).
> 
> Without it, local login (demo users) still work, but the auth server and Google sign-in will not. You need to get the secrets from one of our team members for it (or you can reverse engineer it yourself with your own secrets with minimal effort.)


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

## P.S 
`/docs` turi daugiau info apie kokybiniu reikalvimu igyvendinimus (destytojau, sitas jums <3 )
