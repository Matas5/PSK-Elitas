# Memory management

**Description:**
Parinkti techniniai projektiniai sprendimai turi būti orientuoti į taupų atminties (RAM) naudojimą:
- component life-cycle management
- use-case įgyvendinimui nenaudoti SessionScoped komponentų

**Implementation:**
No session-scoped state for the use case; reads are paged so full history is never held in RAM.

## Stateless singleton services

**File:** [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java)
**Lines:** 25-31

Singletons whose only fields are injected collaborators. Per-request data (`userId`, DTOs, `Pageable`) arrives as method params and is GC'd when the request ends. `RiskService.java:25` is the same.

```java
@Service
@RequiredArgsConstructor
public class RiskValueService {
    private final RiskValueRepository riskValueRepository;
    private final RiskRepository riskRepository;
    private final TeamService teamService;
}
```

## No session-scoped components

**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java)
**Lines:** 29-33

User id read from the header per call. No `@SessionScope`/`@SessionAttributes`/`HttpSession` anywhere.

```java
String userId = request.getHeader("X-User-Id");
if (userId == null || userId.isBlank()) {
    throw new IllegalArgumentException("Missing X-User-Id header");
}
return userId;
```

## Paged reads, clamped page size

**File:** [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java)
**Lines:** 16

```java
Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable);
```

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskValueController.java](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java)
**Lines:** 89-102

`size` is clamped to 1..100, so a client can't pull an arbitrarily large page.

```java
int safePage = Math.max(page, 0);
int safeSize = Math.min(Math.max(size, 1), 100);
...
return PageRequest.of(safePage, safeSize, Sort.by(direction, property));
```

## Frontend keeps one page in state

**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx)
**Lines:** 296-321

Stores only the current page (`data.content`) plus `totalElements` for the pager, not the whole history.

```javascript
const loadValues = useCallback(async () => {
  ...
  const data = await listRiskValues(selectedRisk.id, { page, size: rowsPerPage, sortField, sortDirection });
  setValues(data.content || []);
  setTotalElements(data.totalElements || 0);
}, [page, rowsPerPage, selectedRisk, sortDirection, sortField]);
```
