# Data Consistency with Optimistic Locking

Requirement: When multiple users edit the same object, detect conflicts and let user choose: **reload**, **merge & retry**, or **blindly overwrite**.

---

## Version Fields (JPA)

### Risk Entity
**File:** [backend/src/main/java/com/riskmonitor/entity/Risk.java](backend/src/main/java/com/riskmonitor/entity/Risk.java)

```java
@Version
@Column(name = "version")
private Long version;
```

### RiskValue Entity
**File:** [backend/src/main/java/com/riskmonitor/entity/RiskValue.java](backend/src/main/java/com/riskmonitor/entity/RiskValue.java)

```java
@Version
@Column(name = "version")
private Long version;
```

**How it works:** Hibernate automatically increments version on every update.

---

## Conflict Detection

### Backend: Check Version Before Save
**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)

```java
public RiskResp updateRisk(UUID id, RiskUpdateReq req, String userId) {
    Risk risk = riskRepository.findById(id).orElseThrow();
    
    // Check if version matches
    if (!risk.getVersion().equals(req.version())) {
        throw new OptimisticLockingConflictException(
            "Version mismatch", id, risk.getVersion(), RiskResp.from(risk)
        );
    }
    
    // Safe to update
    risk.setName(req.name());
    // ... other fields ...
    return RiskResp.from(riskRepository.save(risk));
}
```

### DTOs: Include Version
**Files:**
- [backend/src/main/java/com/riskmonitor/dto/risk/RiskStruct.java](backend/src/main/java/com/riskmonitor/dto/risk/RiskStruct.java) - `RiskUpdateReq` includes `@NotNull Long version`
- [backend/src/main/java/com/riskmonitor/dto/risk/RiskStruct.java](backend/src/main/java/com/riskmonitor/dto/risk/RiskStruct.java) - `RiskResp` returns `Long version`

### Backend: Same Check For Risk Values
**File:** [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java)

```java
public RiskValue updateValue(UUID riskId, String userId, UUID valueId, UpdateReq request) {
    RiskValue riskValue = getValueForRisk(riskId, userId, valueId);
    if (!riskValue.getVersion().equals(request.version())) {
        throw new OptimisticLockingConflictException(
                "Risk value " + valueId + " was modified by another user",
                valueId, riskValue.getVersion(), Resp.from(riskValue));
    }
    // ... safe to update ...
}
```

**How it works:** logged values use the same version check as risks. `UpdateReq` carries the client's last-seen `version`; on mismatch the same 409 conflict flow runs, so a stale edit is detected instead of silently overwriting.

### Backend: Flush-time Safety Net (409, not 500)
**File:** [backend/src/main/java/com/riskmonitor/config/GlobalExceptionHandler.java](backend/src/main/java/com/riskmonitor/config/GlobalExceptionHandler.java)

```java
@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
public ResponseEntity<ConflictResponse<?>> handleJpaOptimisticLock(
        ObjectOptimisticLockingFailureException ex) {
    UUID id = (ex.getIdentifier() instanceof UUID u) ? u : null;
    return ResponseEntity.status(HttpStatus.CONFLICT).body(new ConflictResponse<>(
            "This record was modified by another user. Please reload.",
            "CONFLICT_VERSION_MISMATCH", id, null, null, null));
}
```

**How it works:** if two truly concurrent updates slip past the explicit version checks, Hibernate's `@Version` bump fails at flush. This handler maps that to HTTP 409 (reload) instead of letting it surface as a 500, for both `Risk` and `RiskValue`.

---

## User Sees Conflict Dialog

**File:** [frontend/src/components/ConflictDialog.jsx](frontend/src/components/ConflictDialog.jsx)

Shows warning: "This risk has been modified by another user since you started editing."

Displays three options:

```javascript
1. Reload      - Discard your changes, load latest from server
2. Overwrite   - Keep your changes, force save as new version  
3. Cancel      - Go back, manually review
```

Shows server's current version with: Name, Category, Description, Last modified timestamp

---

## Three Resolution Options (in CreateRiskDialog)

**File:** [frontend/src/components/CreateRiskDialog.jsx](frontend/src/components/CreateRiskDialog.jsx)

1. **Reload** - Load latest from server (discard local changes)
2. **Overwrite** - Keep local changes, force save with new version  
3. **Cancel** - Go back to form without saving

When user clicks a button, form version is updated and submission is retried (or aborted).
