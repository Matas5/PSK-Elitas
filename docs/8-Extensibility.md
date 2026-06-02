# Extensibility/Glass-box extensibility

**Description:**
Po sistemos sukūrimo turi būti įmanoma arba pakeisti esamą dalykinį algoritmą nauju jo variantu (Strategy design pattern), arba jį "dekoruoti" (Decorator design pattern), taip, kad nereikėtų modifikuoti ir kompiliuoti seno kodo. T.y. būtų pridedamas tik naujas kodas, ir galimai redaguojamas konfigūracinis failas
- Strategy Design Pattern: CDI Alternatives , CDI @Specializes ; Decorator design pattern: CDI Decorators

**Implementation:**
The risk-list ranking algorithm is swappable: two variants picked by config, hot-swappable at runtime, adding a new one needs no edits to old code.

## The interface

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java](../backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java)
**Lines:** 10-13

Every variant implements this; callers only see the interface.

```java
public interface RiskSortStrategy {
    List<RankedRisk> rank(List<Risk> risks);
}
```

## Variant 1: HIGH-reading count (default)

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java](../backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java)
**Lines:** 16-18, 29-38

```java
@Component("highCount")
public class HighRiskCountSortStrategy implements RiskSortStrategy {
    public List<RankedRisk> rank(List<Risk> risks) {
        return risks.stream()
                .map(r -> new Scored(r, countHighReadings(r)))
                .sorted(...)
                .map(s -> new RankedRisk(s.risk(), levelFor(s.highCount())))
                .toList();
    }
}
```

## Variant 2: average severity

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java](../backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java)
**Lines:** 16-18, 29-38

Same shape, ranks on mean severity. The whole second algorithm is just one more `@Component`.

```java
@Component("average")
public class AverageSeveritySortStrategy implements RiskSortStrategy {
    public List<RankedRisk> rank(List<Risk> risks) {
        return risks.stream()
                .map(r -> new Scored(r, averageSeverity(r)))
                .sorted(...)
                .map(s -> new RankedRisk(s.risk(), levelFor(s.averageSeverity())))
                .toList();
    }
}
```

## Picking which one runs

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java](../backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java)
**Lines:** 15-51

Spring injects every strategy into a `Map` by bean name; the active one comes from config (`application.properties:26`). A new strategy joins the map on its own, so this class never changes.

```java
@Component
public class RiskSortStrategySelector {
    private final Map<String, RiskSortStrategy> strategies;
    private volatile String activeName;

    public RiskSortStrategySelector(Map<String, RiskSortStrategy> strategies,
            @Value("${riskmonitor.risk.sort-strategy:highCount}") String configuredName) {
        this.strategies = strategies;
        this.activeName = strategies.containsKey(configuredName) ? configuredName : DEFAULT_STRATEGY;
    }
    public RiskSortStrategy current() { return strategies.getOrDefault(activeName, ...); }
    public void setActive(String name) { /* validates */ this.activeName = name; }
}
```

## Who calls it

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](../backend/src/main/java/com/riskmonitor/service/RiskService.java)
**Lines:** 50-54

The service asks the selector for the active strategy and calls `rank()`, never knowing which one runs.

```java
List<RiskResp> result = sortStrategySelector.current()
        .rank(risks)
        .stream()
        .map(ranked -> RiskResp.from(ranked.risk(), ranked.level()))
        .toList();
```

## Live switch (extra)

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java](../backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java)
**Lines:** 31-36

A PUT flips the active strategy at runtime, no restart; the Risks page wires this to a toggle.

```java
@PutMapping
public StrategyResp set(@RequestParam String name) {
    selector.setActive(name);
    return new StrategyResp(selector.getActive(), selector.available());
}
```

Adding a new variant = one `@Component("name") implements RiskSortStrategy` + a config value. No old code changes.
