# PSK-Elitas

Risk-monitor app. Spring Boot 4 / Java 17 backend, React 19 + Vite + MUI frontend, PostgreSQL 16, and a small Node/Express auth server that handles Google OAuth (Passport).

| Service     | Port (host) | Source              |
|-------------|-------------|---------------------|
| Frontend    | 5173        | `frontend/`         |
| Backend     | 8081        | `backend/`          |
| Auth server | 3000        | `authServer.js`     |
| PostgreSQL  | 5433        | `docker-compose.yml`|

---

## 1. Required Software

- Git
- Docker Desktop (or Docker Engine + Compose)
- Java 17 (only if you want to run the backend outside Docker)
- Node.js + npm (only if you want to run the frontend/authserver outside Docker)
- IntelliJ IDEA (optional)

---

## 2. Clone the Repository and Branch Workflow

```bash
cd ~/Desktop
git clone https://github.com/Matas5/PSK-Elitas.git
cd PSK-Elitas
git checkout Dev
git pull origin Dev
```

### Development workflow

We do not work directly on `main`. `main` is the production/stable branch.

During development we work from `Dev`. For each Jira work item, create a feature branch off `Dev`.

Feature branch naming:

```
feature/007-BE-implemented-x-functionality
```

Where:

- `007` — Jira work item number
- `BE` — backend task (use `FE` for frontend)
- `implemented-x-functionality` — short description

Examples:

```
feature/007-BE-implemented-health-endpoint
feature/012-FE-created-risk-form
feature/018-BE-added-risk-repository
```

Create a feature branch:

```bash
git checkout Dev
git pull origin Dev
git checkout -b feature/007-BE-implemented-x-functionality
```

When done:

```bash
git push -u origin feature/007-BE-implemented-x-functionality
```

Open a Pull Request from your feature branch into `Dev`. At the end of the sprint `Dev` is merged into `main`.

---

## 3. Project Structure

```
PSK-Elitas/
├── backend/             Spring Boot backend (Maven, Java 17)
├── frontend/            React + Vite frontend
├── authServer.js        Node/Express auth server (Google OAuth)
├── config/              Passport config
├── routes/              Auth routes
├── docker-compose.yml   Postgres + authserver + backend + frontend
├── Dockerfile.auth      Auth server image
├── .env.example         Template for local secrets
└── README.md
```

---

## 4. Google OAuth Setup

The project uses **shared development OAuth credentials** so the whole team can develop locally without each spinning up a Google Cloud project.

Ask your team lead for:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Store them in your password manager — never paste them into Slack, email, or git.

### Google Cloud Console settings (for reference)

If you ever need to update the OAuth app:

- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:** `http://localhost:3000/auth/callback`

---

## 5. Create your `.env`

From the repo root:

```bash
cp .env.example .env
```

Then edit `.env` and fill in the credentials from your team lead:

```env
GOOGLE_CLIENT_ID=<paste-here>
GOOGLE_CLIENT_SECRET=<paste-here>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback
SESSION_SECRET=<any-random-string>     # e.g. openssl rand -hex 32
```

The other keys (`AUTH_PORT`, `CORS_ORIGIN`, `VITE_AUTH_URL`, `VITE_BACKEND_URL`) already have correct defaults — leave them alone unless you know you need to change them.

---

## 6. Running the Project

### Option A — Full Docker (recommended)

Brings up Postgres + auth server + backend + frontend with one command:

```bash
docker compose up --build
```

Then open `http://localhost:5173`.

Stop everything:

```bash
docker compose down
```

### Option B — Hybrid (Postgres in Docker, app processes on host)

Useful when you want a faster backend/frontend reload loop or to debug from IntelliJ.

Start Postgres only:

```bash
docker compose up -d postgres
```

Backend (new terminal):

```bash
cd backend
./mvnw spring-boot:run            # Windows: mvnw.cmd spring-boot:run
```

Frontend (new terminal):

```bash
cd frontend
npm install
npm run dev
```

Auth server (new terminal, from repo root):

```bash
npm install
npm run dev                       # node --watch authServer.js
```

---

## 7. URLs and Health Checks

| What                  | URL                                                | Expected     |
|-----------------------|----------------------------------------------------|--------------|
| Frontend              | http://localhost:5173                              | UI loads     |
| Backend health        | http://localhost:8081/api/health                   | `OK`         |
| Auth server config    | http://localhost:3000/debug/config                 | JSON         |
| Postgres              | `localhost:5433` (db `risk_monitor`)               | accepts conn |

PostgreSQL credentials (dev only):

- Database: `risk_monitor`
- User: `dev_user`
- Password: `dev_password`
- Host port: `5433` (container exposes `5432` internally)

---

## 8. Troubleshooting

**`TokenError: Bad Request` when logging in**

- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` are correct and have no trailing spaces.
- Restart: `docker compose down && docker compose up -d`.

**OAuth callback fails / redirect mismatch**

- Verify `GOOGLE_CALLBACK_URL` in `.env` exactly matches an authorized redirect URI in Google Cloud Console.

**CORS errors from the frontend**

- Confirm `CORS_ORIGIN` in `.env` includes your frontend origin (`http://localhost:5173`).

**Can't reach `localhost:5173`**

- First build takes 10–15s. Tail logs: `docker compose logs -f frontend`.

**Port already in use**

- Another process is on 3000, 5173, 8081, or 5433. Stop it or change the host-port mapping in `docker-compose.yml`.

**Backend can't reach Postgres**

- Make sure the `postgres` service is healthy: `docker compose ps`. The backend container uses `postgres:5432` internally; the host uses `localhost:5433`.

---

## 9. Implemented Features

### Risk List

Users can list, view, create, edit, and delete risks. Each risk has a category, logging frequency, unit of measurement, evaluation direction, and risk-level thresholds.

- [x] ~~Backend `GET /api/risks` (list endpoint)~~
- [x] ~~Frontend API methods (`listRisks`, `getRisk`, `createRisk`, `updateRisk`, `deleteRisk`)~~
- [x] ~~`Risks.jsx` loads and displays the risk list~~
- [x] ~~MUI table layout with clickable rows~~
- [x] ~~Formatting helpers (`formatFrequency`, `formatDirection`, `formatThresholds`)~~
- [x] ~~Read-only `RiskDetailsDialog` component~~
- [x] ~~Row selection opens the details modal~~
- [x] ~~List refreshes after creating a risk~~
- [x] ~~Delete flow with confirmation~~
- [x] ~~Edit flow (form dialog reused for create/edit)~~
- [x] ~~`category` field on `Risk` entity, DTOs, and forms~~
- [x] ~~Loading / empty / error states on the list page~~
- [x] ~~Verified end-to-end (frontend lint+build, backend tests, manual flow)~~

---

## 10. Security Notes

- Never commit `.env` — it is gitignored for a reason.
- Never share credentials over Slack, email, or git.
- The shared OAuth credentials are **development only**.
- Each developer has their own local Postgres instance in Docker — no shared dev DB.
