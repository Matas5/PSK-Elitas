package com.riskmonitor.service.ranking;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.riskmonitor.dto.risk.RiskLevel;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.repository.RiskValueRepository;

import lombok.RequiredArgsConstructor;

// default strategy: ranks risks by how many HIGH readings they have, most first.
// bean name "highCount".
@Component("highCount")
@RequiredArgsConstructor
public class HighRiskCountSortStrategy implements RiskSortStrategy {

    // 7+ HIGH readings makes the risk HIGH, 2+ MEDIUM, otherwise LOW
    private static final long HIGH_LEVEL_THRESHOLD = 7;
    private static final long MEDIUM_LEVEL_THRESHOLD = 2;

    private final RiskValueRepository riskValueRepository;

    private record Scored(Risk risk, long highCount) {
    }

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

    private long countHighReadings(Risk risk) {
        return riskValueRepository.findByRiskIdOrderByRecordedAtAsc(risk.getId()).stream()
                .filter(v -> RiskSeverity.rank(risk, v.getValue()) == RiskSeverity.HIGH)
                .count();
    }

    private RiskLevel levelFor(long highCount) {
        if (highCount >= HIGH_LEVEL_THRESHOLD) {
            return RiskLevel.HIGH;
        }
        if (highCount >= MEDIUM_LEVEL_THRESHOLD) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }
}
