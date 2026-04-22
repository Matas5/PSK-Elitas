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

### Step 3: Verify Backend is Running

Test the hello endpoint:

```bash
curl http://localhost:8081/api/risk-indicators/hello
```

**Expected response:**
```
Hello from Risk Monitor Backend!
```


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

Frontend is now running on **http://localhost:3000**

### Step 3: Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

You should see:
- **Navigation Bar** with "Hello World" and "Risk Indicators" tabs
- **Hello World Demo** section with a "Test Backend Connection" button

---

## Testing the Full Stack

### 1. Test Backend Connection

Click the **"Test Backend Connection"** button on the frontend.

**Expected Result:**
```
Backend says: Hello from Risk Monitor Backend!
```

### 2. Interactive API Testing with Swagger UI

Open your browser and navigate to:
```
http://localhost:8081/swagger-ui.html
```

### 3. Create a Risk Indicator (via API)

```
PSK-Elitas/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/riskmonitor/
│   │       │   ├── RiskMonitorApplication.java        (Entry Point)
│   │       │   ├── controller/
│   │       │   │   └── RiskIndicatorController.java    (Presentation Layer)
│   │       │   ├── service/
│   │       │   │   └── RiskIndicatorService.java       (Business Logic Layer)
│   │       │   ├── repository/
│   │       │   │   └── RiskIndicatorRepository.java    (Data Access Layer)
│   │       │   └── model/
│   │       │       └── RiskIndicator.java              (Entity Model)
│   │       └── resources/
│   │           └── application.properties
│   ├── target/                                         (Build output)
│   └── pom.xml                                         (Maven configuration)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HelloWorld.jsx                          (Hello World Component)
│   │   │   ├── RiskIndicatorList.jsx                   (Risk Indicators Component)
│   │   │   └── *.css
│   │   ├── services/
│   │   │   └── apiService.js                           (API Communication Layer)
│   │   ├── App.jsx                                     (Main App Component)
│   │   └── main.jsx                                    (React Entry Point)
│   ├── index.html                                      (HTML Template)
│   ├── vite.config.js                                  (Vite Configuration)
│   ├── package.json
│   └── node_modules/                                   (Dependencies)
├── README.md
├── .gitignore
└── .git/
```

---

## Architecture: 3-Tier Multi-Layer Design

The backend follows a **3-tier architectural pattern**:

| Layer                    | Location                              | Responsibility                                      |
| ------------------------ | ------------------------------------- | --------------------------------------------------- |
| **Presentation (Tier 1)** | `controller/RiskIndicatorController` | Handle HTTP requests/responses, route to services  |
| **Business Logic (Tier 2)** | `service/RiskIndicatorService`        | Business rules, risk calculations, validation      |
| **Data Access (Tier 3)**   | `repository/RiskIndicatorRepository`  | Database queries, entity persistence (JPA)         |

**Request Flow:**
```
HTTP Request
    ↓
Controller (RiskIndicatorController) — Parse request
    ↓
Service (RiskIndicatorService) — Apply business logic
    ↓
Repository (RiskIndicatorRepository) — Query database
    ↓
Model (RiskIndicator) — Hibernate/JPA entity
    ↓
Database (H2 in-memory)
```

---

## API Endpoints

| Method   | Endpoint                              | Description                  |
| -------- | ------------------------------------- | ---------------------------- |
| `GET`    | `/api/risk-indicators/hello`          | Test endpoint (hello world)  |
| `GET`    | `/api/risk-indicators`                | List all risk indicators     |
| `GET`    | `/api/risk-indicators/{id}`           | Get risk indicator by ID     |
| `POST`   | `/api/risk-indicators`                | Create a new risk indicator  |
| `PUT`    | `/api/risk-indicators/{id}`           | Update a risk indicator      |
| `DELETE` | `/api/risk-indicators/{id}`           | Delete a risk indicator      |

---

## Risk Level Color System

Risk levels are calculated automatically based on current value vs. thresholds:

- 🟢 **GREEN** — Low Risk (value < yellow threshold)
- 🟡 **YELLOW** — Medium Risk (yellow threshold ≤ value < red threshold)
- 🔴 **RED** — High Risk (value ≥ red threshold)

**Example:**
```
Risk Indicator: "Population Density"
yellowThreshold: 500 people/km²
redThreshold: 5000 people/km²

currentValue: 50 → GREEN ✅
currentValue: 750 → YELLOW ⚠️
currentValue: 6000 → RED 🚨
```

---

## Technologies Used

### Backend (Java/Spring Boot)
- **Framework**: Spring Boot 3.1.5
- **Language**: Java 17
- **Database**: H2 (in-memory, no setup needed)
- **ORM**: Hibernate/JPA
- **Build Tool**: Maven
- **REST**: Spring Web MVC
- **API Documentation**: SpringDoc OpenAPI / Swagger UI

### Frontend (JavaScript/React)
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **HTTP Client**: Axios
- **Styling**: CSS3
- **Runtime**: Node.js

---



## Development Workflow

### Making Changes

**Backend:** Edit Java files in `backend/src/main/java/com/riskmonitor/`, then rebuild:
```bash
mvn clean package -DskipTests
java -jar target/risk-monitor-backend-1.0.0.jar
```

**Frontend:** Edit React files in `frontend/src/`. Vite hot-reloads automatically!

### Debugging

**Backend** — Check logs in terminal running `java -jar`

**Frontend** — Open browser DevTools (F12) → Console tab for errors

---

## Key Code References

| Feature                    | File                                      | Lines |
| -------------------------- | ----------------------------------------- | ----- |
| Hello World Endpoint       | `controller/RiskIndicatorController.java` | 18-20 |
| Risk Level Calculation     | `model/RiskIndicator.java`                | 48-50 |
| Service Business Logic     | `service/RiskIndicatorService.java`       | 15-48 |
| Database Access (JPA)      | `repository/RiskIndicatorRepository.java` | 1-8   |
| React Hello Component      | `frontend/src/components/HelloWorld.jsx`  | 1-60  |
| API Service (Frontend)     | `frontend/src/services/apiService.js`     | 1-60  |

---

## Next Steps

1. ✅ Understand the 3-tier architecture in action
2. ✅ Create and manage risk indicators via API (using Swagger UI)
3. ✅ Monitor risk levels in the UI
4. 🔄 Add charts for risk trends (future enhancement)
5. 🔄 Add authentication and user roles (future enhancement)
6. 🔄 Deploy to production (future enhancement)

---

## Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [SpringDoc OpenAPI / Swagger UI](https://springdoc.org/)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Axios Documentation](https://axios-http.com)
- [Maven Documentation](https://maven.apache.org/guides/)

---

## License

This project is part of VU University course PSK-Elitas (2026).

## Authors

- Development Team
- VU University, 3k2s Semester
