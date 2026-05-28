# Concurrency: Multi-Window and Multi-Tab Usage Support

Requirement: One user must be able to use the system simultaneously in multiple browser windows/tabs using the same account/session:

* do not store use-case data in session
* RequestScoped, ViewScoped, ConversationScoped considerations

---

## Stateless Request Processing

### Backend: REST Controllers Process Independent Requests

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskController.java](backend/src/main/java/com/riskmonitor/controller/RiskController.java)

The backend is implemented as a stateless REST API. Each HTTP request contains all information required for processing and does not rely on mutable server-side session state.

Example:

```java id="dr3xv9"
@GetMapping("/{id}")
public RiskResp getRisk(
        @PathVariable UUID id,
        @RequestHeader("X-Google-User-Id") String googleUserId
) {
    return RiskResp.from(
            riskService.getRisk(id, googleUserId)
    );
}
```

The current user context is derived directly from the incoming request header rather than stored in a server-side session object.

Concrete source lines:

* request-scoped user identification via request header
* request parameters fully define operation context
* no session state mutation

This design allows the same user account to safely perform actions from multiple browser tabs/windows simultaneously.

---

## Persistent State Stored in Database

### Backend: Risk Data Persisted Through Repository Layer

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)

Risk data is persisted in PostgreSQL through Spring Data JPA repositories instead of temporary in-memory session objects.

Example:

```java id="n8qj5w"
@Transactional
public Risk updateRisk(UUID id, RiskUpdateReq req, String googleUserId) {

    Risk risk = getRisk(id, googleUserId);

    risk.update(new Risk.UpdateRiskFields(
            req.name().trim(),
            req.category().trim(),
            req.description(),
            req.timeIntervalValue(),
            req.timeIntervalUnit(),
            req.measurementUnit().trim(),
            lowerMax,
            lowerMedium,
            upperMedium,
            upperMax,
            req.validFrom(),
            req.validUntil()
    ));

    return riskRepository.save(risk);
}
```

Concrete source lines:

* request loads current entity state from repository
* modifications are applied transactionally
* updated state is persisted directly to database

Because state is persisted centrally in the database, multiple tabs/windows observe consistent shared data rather than isolated session copies.

---

## Frontend: Independent Browser Tab State

### Frontend: Local Component State Per Browser Tab

The frontend uses component-local React state rather than shared server-side session state for UI interactions.

Examples include:

* pagination state
* selected risk
* dialog visibility
* form editing state

Each browser tab maintains its own isolated frontend component state, allowing independent concurrent interaction without interfering with other open tabs.

---

## RequestScoped / ViewScoped / ConversationScoped Considerations

The project architecture follows stateless REST principles and therefore does not require:

* `ViewScoped`
* `ConversationScoped`
* session-scoped conversational components

Each request is processed independently using:

* request parameters
* request headers
* persistent database state

instead of long-lived conversational server-side objects.

This avoids cross-tab interference and improves concurrent usability.

---
