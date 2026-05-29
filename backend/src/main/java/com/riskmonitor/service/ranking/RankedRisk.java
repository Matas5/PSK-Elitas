package com.riskmonitor.service.ranking;

import com.riskmonitor.dto.risk.RiskLevel;
import com.riskmonitor.entity.Risk;

// a risk plus the level the active strategy gave it
public record RankedRisk(Risk risk, RiskLevel level) {
}
