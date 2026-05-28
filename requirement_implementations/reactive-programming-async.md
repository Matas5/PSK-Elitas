# Reactive Programming / Asynchronous Non-Blocking Communication

Requirement: A time-consuming operation on the backend shouldn't make the browser wait or freeze. The page has to stay alive (responsive) while the work happens.

The main showcase is report generation: you ask for a CSV, the request comes back instantly, the heavy work runs on a background thread, and the Reports page polls until it's ready while you keep clicking around. The risk list is a lighter second example.

---

## Example 1: turning async on

**File:** [backend/src/main/java/com/riskmonitor/BackendApplication.java](backend/src/main/java/com/riskmonitor/BackendApplication.java)

**How it works:** `@EnableAsync` makes `@Async` methods run on a background `task-N` thread instead of the caller's.

```java
@SpringBootApplication
@EnableAsync
public class BackendApplication { ... }
```

---

## Example 2: the request returns instantly

**File:** [backend/src/main/java/com/riskmonitor/controller/ReportController.java](backend/src/main/java/com/riskmonitor/controller/ReportController.java)

**How it works:** the POST saves a PENDING row, starts the background job, and returns `202` right away (~0.17s). The browser never waits for the actual work.

```java
@PostMapping("/csv")
public ResponseEntity<ReportResp> generateCsv(@RequestParam UUID teamId, @CurrentUserId String userId) {
    Report report = reportService.requestCsv(userId, teamId);   // saves PENDING + fires the async job
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(ReportResp.from(report));
}
```

---

## Example 3: the heavy work runs off-thread

**File:** [backend/src/main/java/com/riskmonitor/service/ReportGenerator.java](backend/src/main/java/com/riskmonitor/service/ReportGenerator.java)

**How it works:** runs on a `task-N` thread after the response is already sent. `simulateWork()` is a configurable delay standing in for a heavy job; when done it flips the row to READY.

```java
@Async
public void generateCsvAsync(UUID reportId) {
    Report report = reportRepository.findById(reportId).orElseThrow();
    simulateWork();                                  // configurable delay (default 4s)
    report.markReady(buildCsv(report.getTeamId()));
    reportRepository.save(report);
}
```

---

## Example 4: the page stays alive

**File:** [frontend/src/pages/Reports.jsx](frontend/src/pages/Reports.jsx)

**How it works:** while a report is PENDING the page polls every 2s in the background. Nothing blocks, you can navigate or save a chart meanwhile; when it's READY the chip flips.

```javascript
useEffect(() => {
  if (!reports.some((r) => r.status === 'PENDING')) return undefined;
  const timer = setInterval(loadReports, 2000);
  return () => clearInterval(timer);
}, [reports, activeTeamId, loadReports]);
```

---

## Example 5: the risk list (lighter case)

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskController.java](backend/src/main/java/com/riskmonitor/controller/RiskController.java)

**How it works:** the handler returns a `CompletableFuture`, so Spring MVC frees the Tomcat worker thread and only finishes the request once the future resolves.

```java
@GetMapping
public CompletableFuture<List<RiskResp>> listRisks(@CurrentUserId String userId,
                                                   @RequestParam(required = false) UUID teamId) {
    return riskService.listRisks(userId, teamId);   // service method is @Async
}
```

---

## What you see

The backend log shows the work on a `task-N` thread, with a gap between "running" and "ready" while the POST already returned:

```
INFO [task-1] ReportGenerator : generateCsvAsync running on thread task-1
INFO [task-1] ReportGenerator : Report 0ce1... ready (7006 bytes) on thread task-1
```
