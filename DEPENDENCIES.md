# Project Dependencies

## Backend (Java/Spring)

| Library | Purpose | Status |
|---------|---------|--------|
| Spring Boot Web Starter | REST APIs | ✓ |
| Spring Boot Data JPA | Database operations | ✓ |
| H2 Database | Development/testing database | ✓ |
| Lombok | Reduces boilerplate code | Optional |
| SpringDoc OpenAPI | Generates Swagger UI documentation | ✓ |
| Spring Boot Test | Unit testing framework | ✓ |

### Backend Details
- **Spring Boot Version**: 3.1.5
- **Java Version**: 17
- **Build Tool**: Maven

---

## Frontend (React)

| Library | Purpose | Status |
|---------|---------|--------|
| React | UI framework | ✓ |
| React DOM | Rendering React components | ✓ |
| Axios | HTTP requests to backend | ✓ |
| Vite | Build tool & dev server | ✓ |

### Frontend Details
- **React Version**: 18.2.0
- **Vite Version**: 5.0.0
- **Package Manager**: npm

---

## Notes

- All marked with ✓ are currently in active use
- Lombok is marked as optional but is included in the project
- H2 is configured for development; production database should be configured separately
- All libraries are at stable versions
