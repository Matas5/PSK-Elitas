# Reactive programming; Asynchronous/non-blocking communication

**Description:**
Serveryje ilgai trunkanti operacija neturi priversti naršyklės ilgai laukti atsakymo. Naršyklės puslapis privalo likti "gyvas" (responsive)

**Implementation:**
A long backend job doesn't freeze the browser. Main case: report generation returns instantly, builds on a background thread, and the page polls until ready.

## Async enabled

**File:** [backend/src/main/java/com/riskmonitor/BackendApplication.java](../backend/src/main/java/com/riskmonitor/BackendApplication.java)
**Lines:** 9-10, 12

`@EnableAsync` runs `@Async` methods on a background `task-N` thread.

```java
@SpringBootApplication
@EnableAsync
public class BackendApplication { ... }
```

## Request returns instantly

**File:** [backend/src/main/java/com/riskmonitor/controller/ReportController.java](../backend/src/main/java/com/riskmonitor/controller/ReportController.java)
**Lines:** 40-46

Saves a PENDING row, fires the background job, returns `202` right away.

```java
@PostMapping("/csv")
public ResponseEntity<ReportResp> generateCsv(@RequestParam UUID teamId,
                                              @RequestParam(required = false) String strategy,
                                              @CurrentUserId String userId) {
    Report report = reportService.requestCsv(userId, teamId, strategy);
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(ReportResp.from(report));
}
```

## Heavy work runs off-thread

**File:** [backend/src/main/java/com/riskmonitor/service/ReportGenerator.java](../backend/src/main/java/com/riskmonitor/service/ReportGenerator.java)
**Lines:** 44-63

Runs after the response is sent; `simulateWork()` is a configurable delay, then the row flips to READY.

```java
@Async
public void generateCsvAsync(UUID reportId, String strategyName) {
    var report = reportRepository.findById(reportId).orElse(null);
    if (report == null) return;
    simulateWork();
    report.markReady(buildCsv(report.getTeamId(), strategyName));
    reportRepository.save(report);
}
```

## Page stays alive

**File:** [frontend/src/pages/Reports.jsx](../frontend/src/pages/Reports.jsx)
**Lines:** 69-75

While a report is PENDING the page polls every 2s; nothing blocks, the chip flips when READY.

```javascript
useEffect(() => {
  if (!activeTeamId) return undefined;
  const hasPending = reports.some((r) => r.status === 'PENDING');
  if (!hasPending) return undefined;
  const timer = setInterval(loadReports, 2000);
  return () => clearInterval(timer);
}, [reports, activeTeamId, loadReports]);
```

## Lighter case: the risk list

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskController.java](../backend/src/main/java/com/riskmonitor/controller/RiskController.java)
**Lines:** 44-50

Returns a `CompletableFuture`, freeing the Tomcat worker until it resolves.

```java
@GetMapping
public CompletableFuture<List<RiskResp>> listRisks(
        @CurrentUserId String userId,
        @RequestParam(required = false) UUID teamId
) {
    return riskService.listRisks(userId, teamId);
}
```

## Configurable delay (so PENDING is visible)

**File:** [backend/src/main/java/com/riskmonitor/service/ReportGenerator.java](../backend/src/main/java/com/riskmonitor/service/ReportGenerator.java)
**Lines:** 34-35, 65-74

`simulateWork()` holds the job in PENDING for `riskmonitor.reports.simulated-delay-ms` (default 4000, `application.properties:29`); set 0 to disable.

```java
@Value("${riskmonitor.reports.simulated-delay-ms:4000}")
private long simulatedDelayMs;

private void simulateWork() {
    if (simulatedDelayMs <= 0) return;
    try {
        Thread.sleep(simulatedDelayMs);
    } catch (InterruptedException ex) {
        Thread.currentThread().interrupt();
    }
}
```
