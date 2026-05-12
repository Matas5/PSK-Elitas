# Developer Setup Guide

This guide will get you up and running with the PSK-Elitas project in minutes.

## Prerequisites

- Docker and Docker Compose installed
- Git
- Ask your team lead for the **shared development Google OAuth credentials**

## Get the Shared Development Credentials

The project uses **shared development OAuth credentials** so all team members can develop locally without setting up their own Google Cloud projects.

**Ask your team lead (e.g.,  for:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Store these safely in your password manager or team wiki.

## Clone the Repository

```bash
git clone https://github.com/Matas5/PSK-Elitas.git
cd PSK-Elitas
```

## Create Your .env File

Copy the example configuration:

```bash
cp .env.example .env
```

Then edit `.env` and replace these values with the credentials from your team lead:

```env
GOOGLE_CLIENT_ID=<paste-here>
GOOGLE_CLIENT_SECRET=<paste-here>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/callback
SESSION_SECRET=<any-random-string>
```


## Start the Application

```bash
docker-compose up --build
```

This will start all services:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8081
- **Auth Server**: http://localhost:3000
- **Database**: PostgreSQL on port 5432

## Stop the Application

```bash
docker-compose down
```

## Troubleshooting

### "TokenError: Bad Request" when logging in
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces in the `.env` file
- Restart containers: `docker-compose down && docker-compose up -d`

### Can't reach localhost:5173
- Wait 10-15 seconds for the frontend to start (first build takes longer)
- Check logs: `docker-compose logs frontend`

### Port already in use
- Another service is using ports 3000, 5173, 8081, or 5432
- Either stop that service or change ports in `docker-compose.yml`

## Important Security Notes

- **Never commit your `.env` file** - it's in `.gitignore` for this reason
- **Never share credentials in Slack, email, or Git** - use your team's secure credential sharing method
- The development credentials are shared for **development only**
- Each developer has their own local database instance in Docker
