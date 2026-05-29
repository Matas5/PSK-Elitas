# Checklist

Demo map for the requirements. Each has a fuller write-up in their respected files in this folder.

## Shown in the UI

**1. Concurrency** - same account in many tabs, no shared session state.
- Demo: log in as `demo`, open two tabs, edit different risks in each.
- Code: `controller/RiskController.java:40` (`@CurrentUserId`, identity per request).

**4. Optimistic locking** - concurrent edits can't silently overwrite each other.
- Demo: `demo` and `demo_employee` both edit "API response latency (P95)"; the second save shows the Reload / Overwrite / Cancel dialog.
- Code: `entity/Risk.java:77` (`@Version`), `service/RiskService.java:130` (version check), `config/GlobalExceptionHandler.java:26` (maps to HTTP 409).

**6. Reactive / async** - a slow job doesn't freeze the page.
- Demo: Risks page -> "Risk report summary"; the UI stays responsive and Downloads flips to Ready on its own.
- Code: `service/ReportGenerator.java:44` (`@Async`), `controller/ReportController.java:45` (returns 202 immediately).

**8. Extensibility / Strategy** - swap the ranking algorithm live.
- Demo: the Risks page ranking toggle (High-risk vs Average) reorders the list with no restart.
- Code: `service/ranking/RiskSortStrategy.java:13`, `controller/RiskSortStrategyController.java:31` (hot-swap endpoint).

## Shown in UI + logs

**5. Memory management** - paged reads, stateless singletons.
- Demo: Risk Values page, change rows-per-page / next page (15 values fetched a page at a time).
- Code: `service/RiskService.java:25` (stateless `@Service`); no `@SessionScope` or `HttpSession`.

**7. Cross-cutting AOP logging** - every business call logged, no logging code in the methods.
- Demo: tail the audit log, do any action, see the `BUSINESS_AUDIT` line.
- Code: `audit/BusinessOperationLoggingAspect.java:30` (`@Around` over the `service` package), toggle `application.properties:20`.

## Code only

**2. Security / SQL injection** - parameterized JPA queries, no string-built SQL.
- Code: `repository/RiskRepository.java:13`.

**3. Short transactions** - one transaction per HTTP request, never across user input.
- Code: `service/RiskService.java:35` (read) and `:103` (write).
