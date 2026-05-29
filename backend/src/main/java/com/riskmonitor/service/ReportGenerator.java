package com.riskmonitor.service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.riskmonitor.entity.Risk;
import com.riskmonitor.repository.ReportRepository;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import com.riskmonitor.service.ranking.RankedRisk;
import com.riskmonitor.service.ranking.RiskSeverity;
import com.riskmonitor.service.ranking.RiskSortStrategy;
import com.riskmonitor.service.ranking.RiskSortStrategySelector;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// runs the slow part of report generation off the request thread.
// separate bean on purpose: @Async only proxies when called from another bean, not via this.
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportGenerator {

    // stand-in for a heavy compilation so PENDING is actually visible. kept out of any
    // transaction so we don't hold a DB connection open while sleeping (see #3, short txns).
    @Value("${riskmonitor.reports.simulated-delay-ms:4000}")
    private long simulatedDelayMs;

    private final ReportRepository reportRepository;
    private final RiskRepository riskRepository;
    private final RiskValueRepository riskValueRepository;
    // strategies by bean name; report picks one per call without touching the global selector
    private final Map<String, RiskSortStrategy> sortStrategies;
    private final RiskSortStrategySelector strategySelector;

    @Async
    public void generateCsvAsync(UUID reportId, String strategyName) {
        log.info("generateCsvAsync running on thread {}", Thread.currentThread().getName());
        var report = reportRepository.findById(reportId).orElse(null);
        if (report == null) {
            return;
        }
        try {
            simulateWork();
            byte[] csv = buildCsv(report.getTeamId(), strategyName);
            report.markReady(csv);
            reportRepository.save(report);
            log.info("Report {} ready ({} bytes) on thread {}",
                    reportId, report.getSizeBytes(), Thread.currentThread().getName());
        } catch (Exception ex) {
            log.error("Report {} failed", reportId, ex);
            report.markFailed();
            reportRepository.save(report);
        }
    }

    private void simulateWork() {
        if (simulatedDelayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(simulatedDelayMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    // one row per risk, in the chosen strategy's order. no risks -> header only.
    private byte[] buildCsv(UUID teamId, String strategyName) {
        StringBuilder sb = new StringBuilder();
        sb.append("Rank,Risk,Category,Level,Threshold breaches\n");

        List<Risk> risks = riskRepository.findAllByTeamId(teamId, Sort.by(Sort.Direction.ASC, "name"));
        List<RankedRisk> ranked = resolveStrategy(strategyName).rank(risks);
        int rank = 1;
        for (RankedRisk rr : ranked) {
            Risk risk = rr.risk();
            long breaches = riskValueRepository.findByRiskIdOrderByRecordedAtAsc(risk.getId()).stream()
                    .filter(v -> RiskSeverity.rank(risk, v.getValue()) > RiskSeverity.LOW)
                    .count();
            sb.append(rank++).append(',')
                    .append(csv(risk.getName())).append(',')
                    .append(csv(risk.getCategory())).append(',')
                    .append(rr.level().name()).append(',')
                    .append(breaches).append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // strategy by name, fall back to the active default if unknown/blank
    private RiskSortStrategy resolveStrategy(String strategyName) {
        if (strategyName != null && sortStrategies.containsKey(strategyName)) {
            return sortStrategies.get(strategyName);
        }
        return strategySelector.current();
    }

    // quote and escape a CSV field so commas/quotes in names don't break columns
    private static String csv(String field) {
        String s = field == null ? "" : field;
        return '"' + s.replace("\"", "\"\"") + '"';
    }
}
