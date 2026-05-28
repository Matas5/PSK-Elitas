package com.riskmonitor.service.ranking;

import java.math.BigDecimal;

import com.riskmonitor.entity.Risk;

// classifies one reading into a severity rank using the risk's threshold bands.
// backend port of the frontend classifyRiskLevel. 0 = LOW, 1 = MEDIUM, 2 = HIGH.
public final class RiskSeverity {

    public static final int LOW = 0;
    public static final int MEDIUM = 1;
    public static final int HIGH = 2;

    private RiskSeverity() {
    }

    public static int rank(Risk risk, BigDecimal value) {
        if (risk == null || value == null) {
            return LOW;
        }

        int level = LOW;

        BigDecimal upperMax = risk.getUpperMaxThreshold();
        BigDecimal upperMid = risk.getUpperMidThreshold();
        if (upperMax != null && value.compareTo(upperMax) >= 0) {
            level = Math.max(level, HIGH);
        } else if (upperMid != null && value.compareTo(upperMid) >= 0) {
            level = Math.max(level, MEDIUM);
        }

        BigDecimal lowerMin = risk.getLowerMinThreshold();
        BigDecimal lowerMid = risk.getLowerMidThreshold();
        if (lowerMin != null && value.compareTo(lowerMin) <= 0) {
            level = Math.max(level, HIGH);
        } else if (lowerMid != null && value.compareTo(lowerMid) <= 0) {
            level = Math.max(level, MEDIUM);
        }

        return level;
    }
}
