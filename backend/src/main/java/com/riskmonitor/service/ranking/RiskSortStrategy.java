package com.riskmonitor.service.ranking;

import java.util.List;

import com.riskmonitor.entity.Risk;

// Strategy for the risk list: each impl ranks the risks and classifies each into a level.
// Active impl is picked by config (RiskSortStrategySelector), so a new ranking is just a
// new @Component + a config value, no edits to old code.
public interface RiskSortStrategy {

    // ranked most-relevant first, each with its level; don't mutate input, keep order deterministic
    List<RankedRisk> rank(List<Risk> risks);
}
