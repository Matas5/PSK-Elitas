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
