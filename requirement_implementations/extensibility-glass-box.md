# Extensibility / Glass-box Extensibility (graded requirement #8)

**Requirement (LT):** Po sistemos sukūrimo turi būti įmanoma arba pakeisti esamą dalykinį
algoritmą nauju jo variantu (**Strategy**), arba jį „dekoruoti" (**Decorator**), taip kad
nereikėtų modifikuoti ir kompiliuoti seno kodo — pridedamas tik naujas kodas ir galimai
redaguojamas konfigūracinis failas. *Java EE atitikmenys: CDI Alternatives / `@Specializes`,
CDI Decorators.*

**Pattern used:** **Strategy** — the business algorithm that **evaluates the Risk list** is
pluggable. Each implementation both **orders** the risks and **classifies** each one into a
severity level (green/yellow/red) from a single evaluation. The active implementation is
selected from a config property at startup and can be **hot-swapped at runtime** via an API,
with no restart. Adding a third ranking = one new `@Component` + one config value, with **no
edit or recompile of existing code**.

**Spring equivalent of CDI Alternatives / `@Specializes`:** the selector injects every
strategy as a `Map<beanName, RiskSortStrategy>` and looks the active one up by name — Spring's
idiomatic way to select among interchangeable beans.

## Evidence (file:line)

| Element | File:line |
| --- | --- |
| Strategy interface (the algorithm seam) | `backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java:25` (`List<RankedRisk> rank(List<Risk> risks)`) |
| Result type pairing order + level | `backend/src/main/java/com/riskmonitor/service/ranking/RankedRisk.java` |
| Concrete strategy A — by HIGH-reading count (default) | `backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java:22` (`@Component("highCount")`), evaluation `:37`, level bucketing `:53` |
| Concrete strategy B — by average severity | `backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java:23` (`@Component("average")`), evaluation `:38`, level bucketing `:55` |
| Config-driven, runtime-swappable selector (`Map`-injection, glass-box pivot) | `backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java:32` (`volatile` active name), `:42` (`current()`), `:54` (`setActive()`) |
| Hot-swap API (no restart) | `backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java:29` (`GET`), `:34` (`PUT /api/risks/strategy?name=`) |
| Caller uses the selected strategy, unaware of which one | `backend/src/main/java/com/riskmonitor/service/RiskService.java:51-53` (`sortStrategySelector.current().rank(risks)`) |
| Severity level surfaced to the UI | `backend/src/main/java/com/riskmonitor/dto/risk/RiskStruct.java:122` (`RiskLevel level` field) + `dto/risk/RiskLevel.java` |
| Configuration file (the "edit config" lever / startup default) | `backend/src/main/resources/application.properties:26` (`riskmonitor.risk.sort-strategy=highCount`) |
| Shared severity classifier reused by both strategies | `backend/src/main/java/com/riskmonitor/service/ranking/RiskSeverity.java` |
| Presentation: live toggle + colour/shape indicator | `frontend/src/pages/Risks.jsx` (ToggleButtonGroup → `setSortStrategy`), `frontend/src/components/RiskLevelIndicator.jsx` (green circle / orange square / red triangle, double-encoded) |

## Why this satisfies "no modification/recompile of old code"

Adding a new ranking algorithm after delivery:
1. **Add** one class implementing `RiskSortStrategy`, annotated `@Component("myStrategy")`.
2. **Edit config** to `riskmonitor.risk.sort-strategy=myStrategy`.

`RiskSortStrategySelector`, `RiskService`, the controller, and the existing strategies are
**never touched**. The new bean is auto-discovered into the injected map by Spring.

## Demonstration

Two ways to switch — both observable on the **Risks** page (`frontend/src/pages/Risks.jsx`
renders the list in raw API order; each row shows the active strategy's severity as a blinking
shape):

- **Live (no restart):** the "Ranking strategy" toggle on the Risks page calls
  `PUT /api/risks/strategy?name=…`; the list re-fetches, **reorders, and recolours** instantly.
- **Config + reload (no recompile):** edit `application.properties:26` to `average` and restart
  the backend (`./mvnw spring-boot:run`); Maven copies the resource but does **not** recompile
  Java. The startup default is then `average`.

On the demo seed (`config/DemoDataSeeder.java`, deliberately divergent severity profiles) the
two strategies produce a different order **and** different colours — e.g. *Monthly budget burn*
is a red triangle (HIGH) under `highCount` but a green circle (LOW) under `average`.
