# Extensibility / Glass-box Extensibility

Requirement: After the system is built you should be able to swap a business algorithm for a different version (**Strategy**) or wrap it (**Decorator**) without touching or recompiling the old code. You only add new code, and maybe edit a config file. (CDI versions: Strategy = CDI Alternatives / `@Specializes`, Decorator = CDI Decorators.)

We went with Strategy. The algorithm you can swap is how the risk list gets ranked and coloured. There are two versions, and which one runs is picked from a config value (and can even be flipped live without a restart).

---

## Example 1: the interface you swap

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java](backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java)

**How it works:** every variant implements this. It ranks the risks and tags each with a level. Callers only ever see the interface, never a concrete class.

```java
public interface RiskSortStrategy {
    List<RankedRisk> rank(List<Risk> risks);   // ordered, each paired with its level
}
```

---

## Example 2: variant by HIGH-reading count (default)

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java](backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java)

**How it works:** counts each risk's HIGH readings, worst on top, and buckets that count into a level. Registered as the bean `highCount`.

```java
@Component("highCount")
public class HighRiskCountSortStrategy implements RiskSortStrategy {
    public List<RankedRisk> rank(List<Risk> risks) {
        return risks.stream()
                .map(r -> new Scored(r, countHighReadings(r)))
                .sorted(...)                                          // by count desc, name breaks ties
                .map(s -> new RankedRisk(s.risk(), levelFor(s.highCount())))
                .toList();
    }
}
```

---

## Example 3: variant by average severity

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java](backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java)

**How it works:** same shape, but ranks on the mean severity of each risk's readings. The whole second algorithm is just one more `@Component`, nothing else changed.

```java
@Component("average")
public class AverageSeveritySortStrategy implements RiskSortStrategy {
    public List<RankedRisk> rank(List<Risk> risks) {
        return risks.stream()
                .map(r -> new Scored(r, averageSeverity(r)))
                .sorted(...)                                          // by mean desc, name breaks ties
                .map(s -> new RankedRisk(s.risk(), levelFor(s.averageSeverity())))
                .toList();
    }
}
```

---

## Example 4: picking which one runs

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java](backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java)

**How it works:** Spring injects every strategy into a `Map` keyed by bean name; we read the active name from config and pull that one out. A new strategy shows up in the map on its own, so this class never changes. This is the Spring version of CDI Alternatives / `@Specializes`.

```java
@Component
public class RiskSortStrategySelector {
    private final Map<String, RiskSortStrategy> strategies;   // injected: bean name -> strategy
    private volatile String activeName;

    public RiskSortStrategySelector(Map<String, RiskSortStrategy> strategies,
            @Value("${riskmonitor.risk.sort-strategy:highCount}") String configured) {
        this.strategies = strategies;
        this.activeName = strategies.containsKey(configured) ? configured : "highCount";
    }
    public RiskSortStrategy current() { return strategies.get(activeName); }
    public void setActive(String name) { /* validates name */ this.activeName = name; }
}
```

---

## Example 5: the config file

**File:** [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties)

**How it works:** sets which strategy is active at startup. Change it, restart, done. Maven copies the file but recompiles no Java.

```properties
riskmonitor.risk.sort-strategy=highCount   # or `average`
```

---

## Example 6: who calls it

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)

**How it works:** the service asks the selector for whatever's active and calls `rank()`. It has no idea which algorithm runs, so swapping needs zero changes here.

```java
List<RiskResp> result = sortStrategySelector.current()
        .rank(risks)
        .stream().map(r -> RiskResp.from(r.risk(), r.level())).toList();
```

---

## Example 7: switching it live (extra, not required)

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java](backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java)

**How it works:** a PUT flips the active strategy at runtime, no restart. The Risks page wires this to a toggle, and each row shows the active strategy's level as a coloured shape.

```java
@PutMapping   // PUT /api/risks/strategy?name=average
public StrategyResp set(@RequestParam String name) {
    selector.setActive(name);
    return new StrategyResp(selector.getActive(), selector.available());
}
```

---

## Adding a new one later

No old code touched or recompiled. You just:

1. Add new code: one class `@Component("myStrategy") implements RiskSortStrategy`.
2. Edit config: `riskmonitor.risk.sort-strategy=myStrategy`.

Spring finds the new bean and drops it into the map. The selector, `RiskService`, the controller, and the existing strategies all stay as they are.
