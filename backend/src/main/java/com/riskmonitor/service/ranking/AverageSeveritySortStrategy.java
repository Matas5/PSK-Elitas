package com.riskmonitor.service.ranking;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.riskmonitor.dto.risk.RiskLevel;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.repository.RiskValueRepository;

import lombok.RequiredArgsConstructor;

// alternative strategy: ranks risks by average severity across their readings, highest first.
// a steady medium risk can outrank one with a couple of brief HIGH spikes. bean name "average".
@Component("average")
@RequiredArgsConstructor
public class AverageSeveritySortStrategy implements RiskSortStrategy {

    private static final double HIGH_LEVEL_THRESHOLD = 1.30;    // mean (out of 2.0) >= this -> HIGH
    private static final double MEDIUM_LEVEL_THRESHOLD = 0.95;  // >= this -> MEDIUM, else LOW

    private final RiskValueRepository riskValueRepository;

    private record Scored(Risk risk, double averageSeverity) {
    }

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

    private double averageSeverity(Risk risk) {
        return riskValueRepository.findByRiskIdOrderByRecordedAtAsc(risk.getId()).stream()
                .mapToInt(v -> RiskSeverity.rank(risk, v.getValue()))
                .average()
                .orElse(0.0);
    }

    private RiskLevel levelFor(double averageSeverity) {
        if (averageSeverity >= HIGH_LEVEL_THRESHOLD) {
            return RiskLevel.HIGH;
        }
        if (averageSeverity >= MEDIUM_LEVEL_THRESHOLD) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }
}
