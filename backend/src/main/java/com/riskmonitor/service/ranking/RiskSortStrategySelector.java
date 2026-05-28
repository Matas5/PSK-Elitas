package com.riskmonitor.service.ranking;

import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

// picks the active strategy. spring injects all RiskSortStrategy beans keyed by bean name;
// the active one starts from the riskmonitor.risk.sort-strategy property and can be
// hot-swapped at runtime via setActive. the active name is just app config, not per-user
// state, so the services stay stateless. (spring's take on CDI Alternatives / @Specializes.)
@Component
@Slf4j
public class RiskSortStrategySelector {

    private static final String DEFAULT_STRATEGY = "highCount";

    private final Map<String, RiskSortStrategy> strategies;
    private volatile String activeName;

    public RiskSortStrategySelector(
            Map<String, RiskSortStrategy> strategies,
            @Value("${riskmonitor.risk.sort-strategy:" + DEFAULT_STRATEGY + "}") String configuredName) {
        this.strategies = strategies;
        this.activeName = strategies.containsKey(configuredName) ? configuredName : DEFAULT_STRATEGY;
        log.info("Risk sort strategy initialised to '{}' (available: {})", activeName, strategies.keySet());
    }

    public RiskSortStrategy current() {
        return strategies.getOrDefault(activeName, strategies.get(DEFAULT_STRATEGY));
    }

    public String getActive() {
        return activeName;
    }

    public Set<String> available() {
        return strategies.keySet();
    }

    public void setActive(String name) {
        if (!strategies.containsKey(name)) {
            throw new IllegalArgumentException(
                    "Unknown risk sort strategy '" + name + "'. Available: " + strategies.keySet());
        }
        this.activeName = name;
        log.info("Active risk sort strategy hot-swapped to '{}'", name);
    }
}
