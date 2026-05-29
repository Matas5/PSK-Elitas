# Data consistency; Optimistic locking

**Description:**
Keliems naudotojams (arba vienam keliuose naršyklės languose) tyčia/netyčia redaguojant tą patį DB objektą ir, kylant redaguojamų duomenų versijų konfliktui:
- apie konfliktą turi būti perspėjamas naudotojas
- naudotojui leidžiama pasirinkti, ar duomenis atsinaujinti, sulyginti ir pakartoti redagavimą, ar aklai užrašyti "ant viršaus" (JPA optimistic locking)

**Implementation:**
Concurrent edits to the same record are detected via JPA `@Version`; the user is warned and offered reload / overwrite / cancel.

## Version field

**File:** [backend/src/main/java/com/riskmonitor/entity/Risk.java](backend/src/main/java/com/riskmonitor/entity/Risk.java)
**Lines:** 77-79

Hibernate bumps `version` on every update; `RiskValue.java:49-51` has the same field.

```java
@Version
@Column(name = "version")
private Long version;
```

## Conflict detection on save (Risk)

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)
**Lines:** 127-137

The service compares the client's `version` to the DB version and throws on mismatch, carrying the current data.

```java
Risk risk = getRisk(id, userId);
if (!risk.getVersion().equals(req.version())) {
    throw new OptimisticLockingConflictException(
            "Risk with id " + id + " has been modified by another user",
            risk.getId(), risk.getVersion(), RiskResp.from(risk));
}
```

## Same check for risk values

**File:** [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java)
**Lines:** 70-76

```java
RiskValue riskValue = getValueForRisk(riskId, userId, valueId);
if (!riskValue.getVersion().equals(request.version())) {
    throw new OptimisticLockingConflictException(
            "Risk value " + valueId + " was modified by another user",
            valueId, riskValue.getVersion(), Resp.from(riskValue));
}
```

## Mapped to HTTP 409

**File:** [backend/src/main/java/com/riskmonitor/config/GlobalExceptionHandler.java](backend/src/main/java/com/riskmonitor/config/GlobalExceptionHandler.java)
**Lines:** 26-40

Returns 409 with the current server copy so the client can reload/overwrite. A second handler (`:44-53`) maps the flush-time JPA race to 409 too, not 500.

```java
@ExceptionHandler(OptimisticLockingConflictException.class)
public ResponseEntity<ConflictResponse<?>> handleOptimisticLockingFailure(
        OptimisticLockingConflictException ex) {
    ConflictResponse<?> response = ConflictResponse.of(
            ex.getResourceId(), null, ex.getCurrentVersion(), ex.getCurrentData());
    return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
}
```

## Frontend resolver

**Files:** [frontend/src/components/ConflictDialog.jsx](frontend/src/components/ConflictDialog.jsx), [frontend/src/components/CreateRiskDialog.jsx](frontend/src/components/CreateRiskDialog.jsx)

On a 409 the editor shows `ConflictDialog` with Reload / Overwrite / Cancel. Risk value edits surface the same 409 as a reload prompt.
