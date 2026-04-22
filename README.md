# Risk Monitor System — 3-Tier Architecture Workshop

A hands-on, educational REST API for monitoring organizational risk indicators. This project demonstrates a **production-grade 3-tier multi-layer architecture** built with **Spring Boot** (Java backend) and **React** (JavaScript frontend).

---

## What We're Building

A comprehensive risk management system with real-time risk indicator monitoring, structured around a clean 3-tier layered architecture. 

**Core Features:**

- **Risk Indicator Registration** — create and manage risk indicators
- **Risk Level Calculation** — automatic color-coded risk assessment (Green/Yellow/Red)
- **Real-time Monitoring** — track risk values and thresholds
- **REST API** — full CRUD operations on risk indicators
- **Responsive UI** — React-based frontend with live updates

---

## Getting Started

### Prerequisites

- **Java 17+** — [Download from java.com](https://www.java.com/)
- **Maven 3.6+** — [Download from maven.apache.org](https://maven.apache.org/)
- **Node.js 16+** — [Download from nodejs.org](https://nodejs.org/)
- **Git** — [Download from git-scm.com](https://git-scm.com/)


## Backend Setup (Spring Boot)

### Step 1: Build the Backend

From the **backend/** directory:

```bash
cd backend
```

Build the project with Maven:

```bash
mvn clean package -DskipTests
```

This creates an executable JAR at: `target/risk-monitor-backend-1.0.0.jar`

### Step 2: Start the Backend

Run the backend JAR:

```bash
java -jar target/risk-monitor-backend-1.0.0.jar
```

**Expected Output:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.5)

2026-04-22T17:21:29.981+03:00  INFO 578978 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8081 (http)
```

Backend is now running on **http://localhost:8081**

## Frontend Setup (React + Vite)

### Step 1: Install Dependencies

From the **frontend/** directory (open a **new terminal**):

```bash
cd frontend
npm install
```

### Step 2: Start the Frontend Dev Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.4.21  ready in 324 ms

  ➜  Local:   http://localhost:3002/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Frontend is now running on **http://localhost:3002**

### Step 3: Open in Browser

Open your browser and navigate to:
```
http://localhost:3002
```

You should see 5 sample risk indicators are automatically loaded:

| Indicator | Current Value | Yellow | Red | Status |
|-----------|---------------|--------|-----|--------|
| Employee Turnover Rate | 25 | 50 | 100 | 🟢 GREEN |
| System Uptime | 98.5% | 95 | 90 | 🟢 GREEN |
| Budget Overrun | 65% | 80 | 100 | 🟡 YELLOW |
| Security Incidents | 15 | 10 | 25 | 🔴 RED |
| Customer Satisfaction | 82/100 | 70 | 50 | 🟢 GREEN |



### Step 4: Test with swagger

Open your browser and navigate to:
```
http://localhost:8081/swagger-ui.html
```

In the ID fields just write one of these numbers: 1, 2, 3, 4, or 5

```
1 = Employee Turnover Rate
2 = System Uptime
3 = Budget Overrun
4 = Security Incidents
5 = Customer Satisfaction Score
```