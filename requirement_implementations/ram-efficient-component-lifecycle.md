# RAM-Efficient Component Lifecycle and Stateless Request Handling

Requirement: Technical design decisions must be oriented toward efficient RAM usage:

- component lifecycle management
- do not use session-scoped components for this use case

---

## Component Lifecycle Management

### Frontend: Avoid State Updates After Component Unmount
**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx#L279)

The Risk Values page uses an `active` flag inside `useEffect` and resets it in the cleanup function. This prevents asynchronous fetch callbacks from writing state after the component is unmounted or after a newer request supersedes the old one.

```javascript
useEffect(() => {
  let active = true;

  listRisks()
    .then((data) => {
      if (active) setRisks(data);
    })
    .finally(() => {
      if (active) setRisksLoading(false);
    });

  return () => {
    active = false;
  };
}, []);
```

Concrete source lines:
- `active` lifecycle guard starts at [RiskValues.jsx:280](frontend/src/pages/RiskValues.jsx#L280)
- state is updated only while active at [RiskValues.jsx:284](frontend/src/pages/RiskValues.jsx#L284)
- cleanup disables future state writes at [RiskValues.jsx:293](frontend/src/pages/RiskValues.jsx#L293)

### Frontend: Same Lifecycle Guard for Paginated Risk Values
**File:** [frontend/src/pages/RiskValues.jsx](frontend/src/pages/RiskValues.jsx#L298)

The paginated risk value request uses the same cleanup pattern, so changing risk, page, page size, or sort order does not keep stale asynchronous state updates alive.

Concrete source lines:
- request effect starts at [RiskValues.jsx:298](frontend/src/pages/RiskValues.jsx#L298)
- old request result is ignored when inactive at [RiskValues.jsx:310](frontend/src/pages/RiskValues.jsx#L310)
- cleanup disables the old request path at [RiskValues.jsx:321](frontend/src/pages/RiskValues.jsx#L321)

---

## RAM-Efficient Data Loading

### Backend: Paginated Reads Instead of Loading Full History
**File:** [backend/src/main/java/com/riskmonitor/controller/RiskValueController.java](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L42)

The risk values endpoint accepts `page`, `size`, and `sort`, so the backend returns only the requested slice of a risk's value history instead of loading all rows into memory for large histories.

Concrete source lines:
- paginated endpoint starts at [RiskValueController.java:42](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L42)
- pagination parameters are accepted at [RiskValueController.java:46](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L46)
- response maps a page, not a full unbounded list, at [RiskValueController.java:50](backend/src/main/java/com/riskmonitor/controller/RiskValueController.java#L50)

### Repository: Spring Data Page API
**File:** [backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java#L16)

The repository exposes `Page<RiskValue> findByRiskId(UUID riskId, Pageable pageable)`, which delegates pagination to the database and avoids keeping the full result set in application RAM.

Concrete source line:
- paginated repository method at [RiskValueRepository.java:16](backend/src/main/java/com/riskmonitor/repository/RiskValueRepository.java#L16)

---

## No Session-Scoped Components

### Backend: User Context Comes From Current Request Headers
**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L25)

Controllers receive the current user id through a request argument resolver. The resolver reads the current `HttpServletRequest` and delegates to an authentication strategy. It does not store user state in a server-side session-scoped component.

Concrete source lines:
- current request is read at [CurrentUserIdArgumentResolver.java:30](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L30)
- user id is resolved from the request at [CurrentUserIdArgumentResolver.java:34](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java#L34)

### Default Profile: Stateless Header-Based User Id
**File:** [backend/src/main/java/com/riskmonitor/service/auth/HeaderUserIdAuthenticationStrategy.java](backend/src/main/java/com/riskmonitor/service/auth/HeaderUserIdAuthenticationStrategy.java#L10)

The default authentication strategy reads `X-User-Id` from the current request header and returns it directly. No server-side session component is created.

Concrete source lines:
- header is read at [HeaderUserIdAuthenticationStrategy.java:11](backend/src/main/java/com/riskmonitor/service/auth/HeaderUserIdAuthenticationStrategy.java#L11)
- user id is returned from request data at [HeaderUserIdAuthenticationStrategy.java:15](backend/src/main/java/com/riskmonitor/service/auth/HeaderUserIdAuthenticationStrategy.java#L15)

### Local Profile: Request-Scoped Header-Based User Id
**File:** [backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java](backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java#L14)

The local profile strategy is stateless: it reads `X-User-Id` from the current request header, validates that the user exists, and returns the id. The code explicitly documents that no server-side session state is kept.

Concrete source lines:
- no server-side session state note at [LocalSessionAuthenticationStrategy.java:14](backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java#L14)
- local user id header is read at [LocalSessionAuthenticationStrategy.java:27](backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java#L27)
- only existence is checked against repository at [LocalSessionAuthenticationStrategy.java:37](backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java#L37)
- request-derived id is returned at [LocalSessionAuthenticationStrategy.java:40](backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java#L40)

### Verification

Project source search found no usage of session-scoped Spring/CDI components or servlet session storage for this use case:

- no `@SessionScoped`
- no `@SessionAttributes`
- no `HttpSession`
- no `sessionScope`
