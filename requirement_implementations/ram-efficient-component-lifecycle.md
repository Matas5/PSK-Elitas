# RAM-Efficient Component Lifecycle and Stateless Request Handling

Requirement: Technical design decisions must be oriented toward efficient RAM usage:

- component lifecycle management
- do not use session-scoped components for this use case

---

## Stateless Singleton Services (no per-user state held in RAM)

### Business beans are stateless singletons
**Files:**
- [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java#L25)
- [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L25)

```java
@Service
@RequiredArgsConstructor
public class RiskValueService {
    private final RiskValueRepository riskValueRepository;
    private final RiskRepository riskRepository;
    private final TeamService teamService;
    // ... only final, injected collaborators. no per-user / per-request fields ...
}
```

**How it works:** each service is a single Spring-managed singleton whose only fields are final, injected collaborators. No use-case or per-user data is stored on the bean, so there is one instance for the whole app regardless of how many users or tabs are active. Memory does not grow per session.

Concrete source lines:
- `@Service` + `@RequiredArgsConstructor` on `RiskService` at [RiskService.java:25](backend/src/main/java/com/riskmonitor/service/RiskService.java#L25)
- same on `RiskValueService` at [RiskValueService.java:25](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L25)

---

## No Session-Scoped Components

### Backend: User Context Comes From The Current Request, Not A Session
**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L20)

```java
String userId = request.getHeader("X-User-Id");
if (userId == null || userId.isBlank()) {
    throw new IllegalArgumentException("Missing X-User-Id header");
}
return userId;
```

**How it works:** controllers receive the current user id through a stateless argument resolver that reads the `X-User-Id` header off the current `HttpServletRequest` and returns it directly. There is no `@SessionScope` bean, no `@SessionAttributes`, and no `HttpSession` storage of use-case data, so nothing is retained server-side between requests.

Concrete source lines:
- header is read from the current request at [CurrentUserIdArgumentResolver.java:29](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L29)
- the request-derived id is returned at [CurrentUserIdArgumentResolver.java:33](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L33)

### Verification

Project source search found no session-scoped Spring/CDI components or servlet session storage for this use case:

- no `@SessionScope` / `@SessionScoped`
- no `@SessionAttributes`
- no `HttpSession`

---

## RAM-Efficient Data Loading (paginated reads)

### Backend: Paginated Endpoint Instead Of Loading Full History
**File:** [backend/src/main/java/com/riskmonitor/controller/RiskValueController.java](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L42)

```java
@GetMapping
public PageResp<Resp> listValues(
        @PathVariable UUID riskId,
        @CurrentUserId String userId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "recordedAt,desc") String sort) {
    return PageResp.from(riskValueService.listValues(riskId, userId, toPageable(page, size, sort)));
}
```

**How it works:** the risk-values endpoint accepts `page`, `size`, and `sort` (and clamps size to a max of 100 in `toPageable`), so only the requested slice of a risk's value history is loaded into memory rather than the entire history.

Concrete source lines:
- paginated endpoint at [RiskValueController.java:42](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L42)
- page / size / sort params at [RiskValueController.java:46](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L46)
- returns a page, not an unbounded list, at [RiskValueController.java:50](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L50)

### Repository: Spring Data Page API
**File:** [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java#L16)

```java
Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable);
```

**How it works:** pagination is delegated to the database (LIMIT/OFFSET), so the full result set is never materialised in application RAM.

Concrete source line:
- paginated repository method at [RiskValueRepository.java:16](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java#L16)

---

## Component Lifecycle Management (frontend)

### Avoid State Updates After Unmount / Superseded Requests
**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx#L345)

```javascript
useEffect(() => {
  let active = true;
  // ... fetch ...
    if (!active) return;        // ignore a superseded / unmounted request
    setValues(data);
  // ...
  return () => {
    active = false;             // cleanup disables future state writes
  };
}, [/* riskId, page, size, sort */]);
```

**How it works:** the effect uses an `active` flag and resets it in the cleanup function, so an in-flight fetch that resolves after the component unmounts (or after a newer request supersedes it) does not write React state. This avoids retaining listeners/closures tied to dead component instances.

Concrete source lines:
- `active` guard declared at [RiskValues.jsx:346](frontend/src/pages/RiskValues.jsx#L346)
- stale/superseded result ignored at [RiskValues.jsx:357](frontend/src/pages/RiskValues.jsx#L357)
- cleanup disables future writes at [RiskValues.jsx:369](frontend/src/pages/RiskValues.jsx#L369)
