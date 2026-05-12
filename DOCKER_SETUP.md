# Docker Compose Setup Guide

This project now supports running with Docker Compose. Follow these steps to get started.

## Prerequisites

1. Docker and Docker Compose installed
2. Google Cloud OAuth credentials configured

## Setup Steps

### 1. Update Google Cloud OAuth Settings

Add these to your Google Cloud Console OAuth 2.0 credentials:

**Authorized JavaScript origins:**
- `http://localhost:3000`
- (keep this as-is for Docker development)

**Authorized redirect URIs:**
- `http://localhost:3000/auth/callback`

### 2. Create Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with:
- `GOOGLE_CLIENT_ID` - from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - from Google Cloud Console
- `SESSION_SECRET` - any random string (e.g., generated with `openssl rand -hex 32`)

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8081
- **Auth Server**: http://localhost:3000
- **Database**: PostgreSQL on port 5432

### 4. Test Login

1. Open http://localhost:5173 in your browser
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You should be redirected back to the application

## How It Works

- The **browser** communicates with services at `localhost` (ports 3000, 5173, 8081)
- **Docker containers** can communicate with each other using service names (e.g., `http://authserver:3000`)
- The auth server's callback URL is `http://localhost:3000/auth/callback` for the browser
- CORS is configured to accept requests from the frontend and internal Docker network

## Troubleshooting

- If you get CORS errors, check that `CORS_ORIGIN` includes your frontend URL
- If OAuth callback fails, verify `GOOGLE_CALLBACK_URL` matches your Google Cloud settings
- Check logs with: `docker-compose logs authserver`
