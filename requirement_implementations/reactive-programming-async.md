# Reactive Programming / Asynchronous Non-Blocking Communication

Requirement: A time-consuming operation taking place on the backend shouldn't make the browser on the user end unresponsive, have them wait for the task to complete.

---

## Enabled async support

**File:** [backend/src/main/java/com/riskmonitor/BackendApplication.java](backend/src/main/java/com/riskmonitor/BackendApplication.java)

```java
@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties(SystemProperties.class)
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

**How it works:** `@EnableAsync` activates Spring's `AsyncAnnotationBeanPostProcessor` returning `CompletableFuture`. More @ https://www.baeldung.com/java-completablefuture#bd-Asynchronous


---

## Async service

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)

```java
@Async
@Transactional(readOnly = true)
public CompletableFuture<List<RiskResp>> listRisks(String userId) {
    log.info("listRisks executing asynchronously on thread {}", Thread.currentThread().getName());
    List<RiskResp> result = riskRepository
            .findAllByUserId(userId, Sort.by(Sort.Direction.ASC, "name"))
            .stream()
            .map(RiskResp::from)
            .toList();
    return CompletableFuture.completedFuture(result);
}
```

**How it works:**

- `@Async` hands the call off to a `TaskExecutor` thread and immediately returns a not-yet-completed `CompletableFuture`. The HTTP worker thread is **not blocked** waiting for the result.
- `@Transactional(readOnly = true)` opens the DB transaction on the executor thread — preserving requirement #3 (one short transaction per HTTP request).
- The thread name is logged so the dispatch is visible to anyone tailing the backend log.

---

## Async handler

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskController.java](backend/src/main/java/com/riskmonitor/controller/RiskController.java)

```java
@GetMapping
public CompletableFuture<List<RiskResp>> listRisks(@CurrentUserId String userId) {
    return riskService.listRisks(userId);
}
```


---

## Frontend changes

**File:** [frontend/src/api/risksApi.js](frontend/src/api/risksApi.js)

```javascript
export async function listRisks() {
    const res = await fetch(`${API_BASE}/risks`, { headers: authHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
```

**File:** [frontend/src/hooks/useOptimisticLocking.js](frontend/src/hooks/useOptimisticLocking.js)

```javascript
const data = await listRisks();
setRisks(data);
```

---

## What reactive changes

### User POV

The user can keep scrolling, interact with other areas, switch tabs, or trigger another action while the request is still being processedl.

### Admin/System POV

The async dispatch is visible in the backend log. Each call to `GET /api/risks` produces an `INFO` line tagged with the executing thread:

```
INFO --- [risk-monitor-backend] [some-thread] c.r.service.RiskService : listRisks executing asynchronously on thread task-3
```

`some-thread` is a fill-in space for the actual name of the thread that ended up, an output as such shows that async requests are being handeled appropriatly.
