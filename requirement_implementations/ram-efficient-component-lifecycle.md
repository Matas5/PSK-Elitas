# RAM-Efficient Component Lifecycle and Stateless Request Handling

Requirement: Technical design decisions must be oriented toward efficient RAM usage:

- component lifecycle management
- do not use session-scoped components for this use case

---

## Stateless Backend Components

### Business Services Keep No Per-User State
**Files:**
- [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java#L25)
- [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L25)

The main business services are Spring singleton services. Their fields are injected collaborators, not user data, page data, request data, or cached risk values. Per-request values such as `userId`, `riskId`, request DTOs, and `Pageable` are passed through method parameters and are eligible for garbage collection after the request finishes.

```java
@Service
@RequiredArgsConstructor
public class RiskValueService {
    private final RiskValueRepository riskValueRepository;
    private final RiskRepository riskRepository;
    private final TeamService teamService;
}
```

Concrete source lines:
- `RiskService` is a singleton service at [RiskService.java:25](backend/src/main/java/com/riskmonitor/service/RiskService.java#L25)
- `RiskService` stores only injected collaborators at [RiskService.java:30](backend/src/main/java/com/riskmonitor/service/RiskService.java#L30)
- `RiskValueService` is a singleton service at [RiskValueService.java:25](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L25)
- `RiskValueService` stores only injected collaborators at [RiskValueService.java:29](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L29)

### Batch Creation Uses Request-Bounded Collections
**File:** [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L45)

Risk value batch creation allocates temporary collections only for the incoming request. The DTO caps a single batch at 500 entries, and the service creates `seen` and `toSave` inside the method rather than storing them on a singleton bean.

Concrete source lines:
- request DTO caps `entries` with `@Size(max = 500)` at [RiskValueStruct.java:32](backend/src/main/java/com/riskmonitor/dto/riskvalue/RiskValueStruct.java#L32)
- request-scoped `seen` set is created at [RiskValueService.java:49](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L49)
- request-scoped `toSave` list is created at [RiskValueService.java:50](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L50)

---

## No Session-Scoped Components

### Backend: Controller User Context Comes From The Current Request
**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L20)

Controllers receive the current user id through `@CurrentUserId`. The resolver reads the current `HttpServletRequest`, extracts the `X-User-Id` header, validates it, and returns it directly for the current controller method call. It does not create a session-scoped user object and does not retain identity between requests.

```java
String userId = request.getHeader("X-User-Id");
if (userId == null || userId.isBlank()) {
    throw new IllegalArgumentException("Missing X-User-Id header");
}
return userId;
```

Concrete source lines:
- resolver targets `@CurrentUserId String` parameters at [CurrentUserIdArgumentResolver.java:15](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L15)
- current request is obtained at [CurrentUserIdArgumentResolver.java:25](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L25)
- header is read from the current request at [CurrentUserIdArgumentResolver.java:29](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L29)
- request-derived id is returned at [CurrentUserIdArgumentResolver.java:33](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L33)

### Backend: Security Context Is Cleared After Each Request
**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java](backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java#L20)

This branch also has a `OncePerRequestFilter` that places the request's `X-User-Id` into `SecurityContextHolder` so the audit aspect can log the real user. The important RAM/lifecycle detail is the `finally` block: the filter clears the security context after the request, so a pooled servlet thread cannot retain the previous request's authentication object.

```java
try {
    filterChain.doFilter(request, response);
} finally {
    SecurityContextHolder.clearContext();
}
```

Concrete source lines:
- filter is request-based via `OncePerRequestFilter` at [CurrentUserAuthFilter.java:20](backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java#L20)
- user id is read from `X-User-Id` at [CurrentUserAuthFilter.java:25](backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java#L25)
- authentication is stored for the current request at [CurrentUserAuthFilter.java:29](backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java#L29)
- security context is cleared in `finally` at [CurrentUserAuthFilter.java:33](backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java#L33)

### Frontend: User Id Travels With Each Request
**File:** [frontend/src/api/riskValuesApi.js](frontend/src/api/riskValuesApi.js#L22)

The frontend sends identity as a request header. The backend does not need a server-side HTTP session to remember the user between calls.

Concrete source lines:
- auth header builder starts at [riskValuesApi.js:22](frontend/src/api/riskValuesApi.js#L22)
- user id is read from browser-local auth data at [riskValuesApi.js:32](frontend/src/api/riskValuesApi.js#L32)
- `X-User-Id` is attached to request headers at [riskValuesApi.js:36](frontend/src/api/riskValuesApi.js#L36)

### Verification

Project source search found no session-scoped Spring/CDI components or servlet session storage for this use case:

- no `@SessionScope` / `@SessionScoped`
- no `@SessionAttributes`
- no `HttpSession`
- no `sessionScope`

---

## RAM-Efficient Data Loading

### Frontend: Main Table Keeps One Page In State
**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx#L338)

The main Risk Values page requests only the selected page of values. It stores `data.content` for the current table page and `totalElements` for pagination controls instead of storing the full value history.

Concrete source lines:
- paged load effect starts at [RiskValues.jsx:338](frontend/src/pages/RiskValues.jsx#L338)
- request includes `page`, `size`, and sort parameters at [RiskValues.jsx:350](frontend/src/pages/RiskValues.jsx#L350)
- only current page content is stored at [RiskValues.jsx:358](frontend/src/pages/RiskValues.jsx#L358)
- total count is stored separately at [RiskValues.jsx:359](frontend/src/pages/RiskValues.jsx#L359)

### Frontend API: Paging Is Explicit At The API Boundary
**File:** [frontend/src/api/riskValuesApi.js](frontend/src/api/riskValuesApi.js#L41)

The API wrapper builds `page`, `size`, and `sort` query parameters for `/api/risks/{riskId}/values`. This prevents the table from hiding an unbounded fetch behind a simple list function.

Concrete source lines:
- paginated API function starts at [riskValuesApi.js:41](frontend/src/api/riskValuesApi.js#L41)
- query parameters are created at [riskValuesApi.js:45](frontend/src/api/riskValuesApi.js#L45)
- request is sent with those parameters at [riskValuesApi.js:50](frontend/src/api/riskValuesApi.js#L50)

### Backend: Page Size Is Clamped
**File:** [backend/src/main/java/com/riskmonitor/controller/RiskValueController.java](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L42)

The risk-values endpoint accepts `page`, `size`, and `sort`, then converts them into a Spring `Pageable`. The controller clamps `size` to the range `1..100`, so a client cannot request an arbitrarily large result set in one response.

```java
int safePage = Math.max(page, 0);
int safeSize = Math.min(Math.max(size, 1), 100);
return PageRequest.of(safePage, safeSize, Sort.by(direction, property));
```

Concrete source lines:
- paginated endpoint starts at [RiskValueController.java:42](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L42)
- page / size / sort params are accepted at [RiskValueController.java:46](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L46)
- page size is clamped at [RiskValueController.java:90](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L90)
- `PageRequest` is created at [RiskValueController.java:102](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L102)

### Backend: Pagination Is Delegated To The Database Layer
**Files:**
- [backend/src/main/java/com/riskmonitor/service/RiskValueService.java](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L39)
- [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java#L16)

The service exposes a paginated read method and delegates it to a Spring Data `Page<RiskValue>` repository method. The database query layer handles the page window, so the main table path does not materialize every value row in backend memory.

```java
Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable);
```

Concrete source lines:
- paginated service method starts at [RiskValueService.java:39](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L39)
- service delegates to `findByRiskId(riskId, pageable)` at [RiskValueService.java:42](backend/src/main/java/com/riskmonitor/service/RiskValueService.java#L42)
- repository declares the paginated method at [RiskValueRepository.java:16](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java#L16)

### Backend DTO: Page Metadata Avoids Full-List Follow-Up Loads
**File:** [backend/src/main/java/com/riskmonitor/dto/riskvalue/RiskValueStruct.java](backend/src/main/java/com/riskmonitor/dto/riskvalue/RiskValueStruct.java#L72)

The response DTO returns current-page `content` plus `totalElements`, `totalPages`, `page`, and `size`. The frontend can render pagination controls from this metadata without loading the entire history.

Concrete source lines:
- page response DTO starts at [RiskValueStruct.java:72](backend/src/main/java/com/riskmonitor/dto/riskvalue/RiskValueStruct.java#L72)
- only `values.getContent()` is mapped into response rows at [RiskValueStruct.java:81](backend/src/main/java/com/riskmonitor/dto/riskvalue/RiskValueStruct.java#L81)
- page metadata is returned at [RiskValueStruct.java:82](backend/src/main/java/com/riskmonitor/dto/riskvalue/RiskValueStruct.java#L82)

### Secondary Full-List Helper Still Uses Bounded Page Requests
**File:** [frontend/src/api/riskValuesApi.js](frontend/src/api/riskValuesApi.js#L61)

Some secondary views need a flat client-side array for local date filtering or graph calculations. `listAllRiskValues` handles that by paging through the same bounded endpoint in chunks of 100, rather than asking the backend for one unbounded response.

Concrete source lines:
- helper comment documents the backend cap at [riskValuesApi.js:61](frontend/src/api/riskValuesApi.js#L61)
- first request uses `size = 100` at [riskValuesApi.js:63](frontend/src/api/riskValuesApi.js#L63)
- additional pages are fetched one at a time at [riskValuesApi.js:67](frontend/src/api/riskValuesApi.js#L67)

---

## Component Lifecycle Management

### Main Risk Values Page Ignores Superseded Async Results
**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx#L338)

The main Risk Values page wraps the asynchronous page load in an effect-local `active` flag. React runs the cleanup when the component unmounts or when dependencies change. If an older request resolves after that cleanup, it returns before writing state.

```javascript
useEffect(() => {
  let active = true;

  listRiskValues(selectedRisk.id, { page, size: rowsPerPage, sortField, sortDirection })
    .then((data) => {
      if (!active) return;
      setValues(data.content || []);
      setTotalElements(data.totalElements || 0);
    })
    .finally(() => {
      if (active) setValuesLoading(false);
    });

  return () => {
    active = false;
  };
}, [page, refreshKey, rowsPerPage, selectedRisk, sortDirection, sortField]);
```

Concrete source lines:
- lifecycle effect starts at [RiskValues.jsx:338](frontend/src/pages/RiskValues.jsx#L338)
- `active` guard is declared at [RiskValues.jsx:346](frontend/src/pages/RiskValues.jsx#L346)
- stale result returns before state writes at [RiskValues.jsx:357](frontend/src/pages/RiskValues.jsx#L357)
- cleanup disables future writes at [RiskValues.jsx:369](frontend/src/pages/RiskValues.jsx#L369)

### Risk Selection Clears Old Page State
**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx#L373)

Changing the selected risk immediately clears the previous page rows, resets the total count, and goes back to page `0`. The component therefore does not keep the old risk's table data alive while the next risk is loading.

Concrete source lines:
- selected risk changes at [RiskValues.jsx:375](frontend/src/pages/RiskValues.jsx#L375)
- page resets at [RiskValues.jsx:376](frontend/src/pages/RiskValues.jsx#L376)
- old rows are cleared at [RiskValues.jsx:377](frontend/src/pages/RiskValues.jsx#L377)
- old total count is cleared at [RiskValues.jsx:378](frontend/src/pages/RiskValues.jsx#L378)

### Log Dialog Uses Cleanup For Default-Date Lookup
**File:** [frontend/src/components/LogRiskValueDialog.jsx](frontend/src/components/LogRiskValueDialog.jsx#L72)

The log dialog looks up the latest value page to suggest the next recorded date. That request also uses an effect-local `active` flag, and it avoids overwriting the form if the user has already edited the date.

Concrete source lines:
- dialog effect starts at [LogRiskValueDialog.jsx:72](frontend/src/components/LogRiskValueDialog.jsx#L72)
- `active` guard is declared at [LogRiskValueDialog.jsx:73](frontend/src/components/LogRiskValueDialog.jsx#L73)
- stale results and user-edited dates are ignored at [LogRiskValueDialog.jsx:76](frontend/src/components/LogRiskValueDialog.jsx#L76)
- cleanup disables future writes at [LogRiskValueDialog.jsx:80](frontend/src/components/LogRiskValueDialog.jsx#L80)
