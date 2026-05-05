## Backend Package Structure

The backend source code is organized into separate packages so that each part of the application has a clear responsibility.

### `config`

Used for application configuration classes.

Examples:
- CORS configuration
- security configuration
- Swagger/OpenAPI configuration
- custom Spring beans

---

### `controller`

Used for REST API endpoints.

Controllers receive HTTP requests from the frontend and return HTTP responses.

Examples:
- `GET /api/health`
- `POST /api/risks`
- `GET /api/risks`

Controllers should stay simple and should not contain heavy business logic.

---

### `service`

Used for business logic.

Services decide what should happen inside the system.

Examples:
- creating a risk
- validating risk thresholds
- calculating if a risk level is green, yellow, or red
- preparing data for graphs

---

### `repository`

Used for database access.

Repositories communicate with PostgreSQL through Spring Data JPA.

Examples:
- saving a risk
- finding a risk by ID
- listing all risks
- deleting a risk

---

### `entity`

Used for database models.

Entities are Java classes that represent database tables.

Example:
- `Risk` entity represents a `risk` table in PostgreSQL

---

### `dto`

Used for Data Transfer Objects.

DTOs define what data is sent between the frontend and backend.

Examples:
- `CreateRiskRequest` contains data needed when creating a risk
- `RiskResponse` contains data returned to the frontend
- `UpdateRiskRequest` contains data needed when editing a risk

DTOs help avoid exposing database entities directly to the frontend.

---

### `exception`

Used for custom errors and error handling.

Examples:
- `RiskNotFoundException`
- validation error responses
- global exception handling

This package helps the backend return clear error messages to the frontend.




After starting the backend, open:

http://localhost:8080/api/health

Expected response:

OK