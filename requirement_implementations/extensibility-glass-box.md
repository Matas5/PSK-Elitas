# Extensibility / Glass-box Extensibility

Requirement: After the system is built you should be able to swap a business algorithm for a different version (**Strategy**) or wrap it (**Decorator**) without touching or recompiling the old code. You only add new code, and maybe edit a config file. (CDI versions: Strategy = CDI Alternatives / `@Specializes`, Decorator = CDI Decorators.)

We went with Strategy. The algorithm you can swap is how the risk list gets ranked and coloured. There are two versions of it, and which one runs is picked from a config value (and can even be flipped live without a restart).

---

## The interface you swap

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java](backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategy.java)

```java
public interface RiskSortStrategy {

    // ranked most-relevant first, each with its level; don't mutate input, keep order deterministic
    List<RankedRisk> rank(List<Risk> risks);
}
```

**How it works:** This is the thing every variant implements. It sorts the risks and tags each one with a level, handing back a `RankedRisk` (the risk plus its level). Everything that uses it only knows about this interface, never the actual class.

---

## Variant 1: by HIGH-reading count (the default)

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java](backend/src/main/java/com/riskmonitor/service/ranking/HighRiskCountSortStrategy.java)

```java
@Component("highCount")
@RequiredArgsConstructor
public class HighRiskCountSortStrategy implements RiskSortStrategy {

    private static final long HIGH_LEVEL_THRESHOLD = 7;    // >= this many HIGH readings -> HIGH
    private static final long MEDIUM_LEVEL_THRESHOLD = 2;  // >= this -> MEDIUM, else LOW

    private final RiskValueRepository riskValueRepository;

    @Override
    public List<RankedRisk> rank(List<Risk> risks) {
        return risks.stream()
                .map(r -> new Scored(r, countHighReadings(r)))
                .sorted(Comparator
                        .comparingLong(Scored::highCount).reversed()
                        .thenComparing(s -> s.risk().getName(), Comparator.nullsLast(String::compareTo)))
                .map(s -> new RankedRisk(s.risk(), levelFor(s.highCount())))
                .toList();
    }
}
```

**How it works:** Counts how many HIGH readings each risk has, puts the worst ones on top (name breaks ties), and turns that count into a level. It's a Spring bean named `highCount`.

---

## Variant 2: by average severity

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java](backend/src/main/java/com/riskmonitor/service/ranking/AverageSeveritySortStrategy.java)

```java
@Component("average")
@RequiredArgsConstructor
public class AverageSeveritySortStrategy implements RiskSortStrategy {

    private static final double HIGH_LEVEL_THRESHOLD = 1.30;    // mean (out of 2.0) >= this -> HIGH
    private static final double MEDIUM_LEVEL_THRESHOLD = 0.95;  // >= this -> MEDIUM, else LOW

    @Override
    public List<RankedRisk> rank(List<Risk> risks) {
        return risks.stream()
                .map(r -> new Scored(r, averageSeverity(r)))
                .sorted(Comparator
                        .comparingDouble(Scored::averageSeverity).reversed()
                        .thenComparing(s -> s.risk().getName(), Comparator.nullsLast(String::compareTo)))
                .map(s -> new RankedRisk(s.risk(), levelFor(s.averageSeverity())))
                .toList();
    }
}
```

**How it works:** Same idea, but it ranks on the average severity of a risk's readings, so something that's steadily medium can beat something with a couple of quick HIGH spikes. Bean's named `average`. The thing to notice: this whole second algorithm is just one more `@Component`, nothing else got changed.

---

## Picking which one runs

**File:** [backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java](backend/src/main/java/com/riskmonitor/service/ranking/RiskSortStrategySelector.java)

```java
@Component
public class RiskSortStrategySelector {

    private static final String DEFAULT_STRATEGY = "highCount";

    private final Map<String, RiskSortStrategy> strategies;
    private volatile String activeName;

    public RiskSortStrategySelector(
            Map<String, RiskSortStrategy> strategies,
            @Value("${riskmonitor.risk.sort-strategy:" + DEFAULT_STRATEGY + "}") String configuredName) {
        this.strategies = strategies;
        this.activeName = strategies.containsKey(configuredName) ? configuredName : DEFAULT_STRATEGY;
    }

    public RiskSortStrategy current() {
        return strategies.getOrDefault(activeName, strategies.get(DEFAULT_STRATEGY));
    }

    public void setActive(String name) {
        if (!strategies.containsKey(name)) {
            throw new IllegalArgumentException(
                    "Unknown risk sort strategy '" + name + "'. Available: " + strategies.keySet());
        }
        this.activeName = name;
    }
}
```

**How it works:** Spring drops every strategy into that `Map` for us, keyed by the bean name. We read the active name from the `riskmonitor.risk.sort-strategy` property and pull that one out of the map. This is the Spring version of CDI Alternatives / `@Specializes`: you pick between beans from config. A new strategy just shows up in the map on its own, so this class never needs editing.

---

## The config file

**File:** [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties)

```properties
# `highCount` or `average` STRATEGU
riskmonitor.risk.sort-strategy=highCount
```

**How it works:** This is what's active on startup. Change it, restart with `./mvnw spring-boot:run`, and you get the other algorithm. Maven copies the properties file but doesn't recompile any Java, so no old code gets recompiled.

---

## Who calls it

**File:** [backend/src/main/java/com/riskmonitor/service/RiskService.java](backend/src/main/java/com/riskmonitor/service/RiskService.java)

```java
List<Risk> risks = riskRepository
        .findAllByTeamId(teamId, Sort.by(Sort.Direction.ASC, "name"));
List<RiskResp> result = sortStrategySelector.current()
        .rank(risks)
        .stream()
        .map(ranked -> RiskResp.from(ranked.risk(), ranked.level()))
        .toList();
```

**How it works:** The service just asks the selector for whatever's active and calls `rank()`. It has no clue which algorithm it's actually running, so swapping them needs zero changes here.

---

## Switching it live (extra, not required)

**File:** [backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java](backend/src/main/java/com/riskmonitor/controller/RiskSortStrategyController.java)

```java
@RestController
@RequestMapping("/api/risks/strategy")
@RequiredArgsConstructor
public class RiskSortStrategyController {

    private final RiskSortStrategySelector selector;

    @GetMapping
    public StrategyResp get() {
        return new StrategyResp(selector.getActive(), selector.available());
    }

    @PutMapping
    public StrategyResp set(@RequestParam String name) {
        selector.setActive(name);
        return new StrategyResp(selector.getActive(), selector.available());
    }
}
```

**How it works:** You can flip the active strategy at runtime with no restart at all (`PUT /api/risks/strategy?name=average`). The config file is still the startup default. On the frontend this is a toggle on the Risks page, and every row shows the active strategy's level as a coloured shape.

---

## Adding a new one later

No old code gets touched or recompiled. All you do:

1. Add new code: one class `@Component("myStrategy") implements RiskSortStrategy`.
2. Edit config: `riskmonitor.risk.sort-strategy=myStrategy`.

Spring finds the new bean and adds it to the map. The selector, `RiskService`, the controller and the two existing strategies all stay exactly as they are.
