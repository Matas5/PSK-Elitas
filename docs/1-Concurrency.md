# Concurrency

**Description:**
Vienas naudotojas gali dirbi su sistema (tame tarpe redagavimo/administravimo režimu) keliuose naršyklės languose (tiek window, tiek tab prasme) tuo pačiu metu, naudodamas tą pačią paskyrą/sesiją (account / login session):
- use-case duomenų nesaugoti sesijoje
- RequestScoped, ViewScoped, ConversationScoped

**Implementation:**
One account can be used in many tabs at once: no use-case data in session, identity comes per request.

## Stateless controller

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskController.java](../backend/src/main/java/com/riskmonitor/controller/RiskController.java)
**Lines:** 39-42

```java
@GetMapping("/{id}")
public RiskResp getRisk(@PathVariable UUID id, @CurrentUserId String userId) {
    return RiskResp.from(riskService.getRisk(id, userId));
}
```

## Identity from the request, not a session

**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java](../backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java)
**Lines:** 29-33

`@CurrentUserId` reads the `X-User-Id` header on every call. No `HttpSession`, no session-scoped bean.

```java
String userId = request.getHeader("X-User-Id");
if (userId == null || userId.isBlank()) {
    throw new IllegalArgumentException("Missing X-User-Id header");
}
return userId;
```

## Shared state lives in the DB

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](../backend/src/main/java/com/riskmonitor/service/RiskService.java)
**Lines:** 103-155

Edits load the entity from the repo and save it back, so every tab reads and writes the same central state.

```java
@Transactional
public Risk updateRisk(UUID id, RiskUpdateReq req, String userId) {
    Risk risk = getRisk(id, userId);
    risk.update(new Risk.UpdateRiskFields(...));
    return riskRepository.save(risk);
}
```

Stateless REST, so no ViewScoped/ConversationScoped components; frontend UI state is per-tab React state.
