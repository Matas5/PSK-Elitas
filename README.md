# PSK-Elitas Project Setup Guide

This guide explains how to start the project on a local computer.

The project uses:

- Spring Boot for the backend
- React for the frontend
- PostgreSQL for the database
- Docker Compose to run PostgreSQL automatically

---

## 1. Required Software

Before starting, install these tools:

- Git
- IntelliJ IDEA
- Java 17
- Node.js and npm
- Docker Desktop
---

## 2. Clone the Repository and Branch Workflow

Open a terminal and choose where you want to store the project.

Example:

cd ~/Desktop

Clone the repository:

git clone https://github.com/Matas5/PSK-Elitas.git

Go into the project folder:

cd PSK-Elitas

Switch to the development branch:

git checkout Dev

Pull the newest version of Dev:

git pull origin Dev

---

Development workflow:

We do not work directly on main.

The main branch is treated as the production/stable branch.

During development, we work from the Dev branch. For each Jira work item, create a separate feature branch from Dev.

Feature branch naming structure:

feature/007-BE-implemented-x-functionality

Where:

007 = Jira work item number
BE = backend task
FE = frontend task
implemented-x-functionality = short description of the work

Examples:

feature/007-BE-implemented-health-endpoint
feature/012-FE-created-risk-form
feature/018-BE-added-risk-repository

To create a feature branch, first make sure you are on Dev:

git checkout Dev
git pull origin Dev

Then create your feature branch:

git checkout -b feature/007-BE-implemented-x-functionality

After finishing your work, push the feature branch:

git push -u origin feature/007-BE-implemented-x-functionality

Then create a Pull Request from your feature branch into Dev.

At the end of the sprint, Dev is merged into main.

---

## 3. Project Structure

The project is organized like this:

PSK-Elitas/
├── backend/
│   └── Spring Boot backend application
├── frontend/
│   └── React frontend application
├── docker-compose.yml
│   └── PostgreSQL database setup
└── README.md
    └── Project instructions

---

## 4. Running the project

### Recommended Development Setup

For development, we recommend running only PostgreSQL with Docker and running the backend/frontend normally.

PostgreSQL Docker configuration:

Database: risk_monitor
User: risk_user
Password: risk_password
Port: 5432

Start PostgreSQL from the project root:

docker compose up -d

Start the backend:

- IntelliJ IDEA: run the main Spring Boot application class
- VS Code / terminal:

cd backend
./mvnw spring-boot:run

On Windows:

cd backend
mvnw.cmd spring-boot:run

Start the frontend in another terminal:

cd frontend
npm install
npm run dev

Frontend URL:

http://localhost:5173

Backend health check:

http://localhost:8080/api/health

Expected response:

OK

---

### Optional Full Docker Setup

If Dockerfiles for backend and frontend are added, the whole project can be started with one command:

docker compose up --build

This starts:

- PostgreSQL
- Spring Boot backend
- React frontend

PostgreSQL Docker configuration:

Database: risk_monitor
User: risk_user
Password: risk_password
Port: 5432

Stop everything:

docker compose down