package com.riskmonitor.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.riskmonitor.entity.Risk;
import com.riskmonitor.entity.RiskValue;
import com.riskmonitor.repository.ReportRepository;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import com.riskmonitor.service.ranking.RiskSeverity;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// runs the slow part of report generation off the request thread.
// separate bean on purpose: @Async only proxies when called from another bean, not via this.
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportGenerator {

    private static final String[] LEVEL_NAMES = {"LOW", "MEDIUM", "HIGH"};

    // stand-in for a heavy compilation so PENDING is actually visible. kept out of any
    // transaction so we don't hold a DB connection open while sleeping (see #3, short txns).
    @Value("${riskmonitor.reports.simulated-delay-ms:4000}")
    private long simulatedDelayMs;

    private final ReportRepository reportRepository;
    private final RiskRepository riskRepository;
    private final RiskValueRepository riskValueRepository;

    @Async
    public void generateCsvAsync(UUID reportId) {
        log.info("generateCsvAsync running on thread {}", Thread.currentThread().getName());
        var report = reportRepository.findById(reportId).orElse(null);
        if (report == null) {
            return;
        }
        try {
            simulateWork();
            byte[] csv = buildCsv(report.getTeamId());
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

    private byte[] buildCsv(UUID teamId) {
        StringBuilder sb = new StringBuilder();
        sb.append("Risk,Category,Recorded At,Value,Level\n");

        List<Risk> risks = riskRepository.findAllByTeamId(teamId, Sort.by(Sort.Direction.ASC, "name"));
        for (Risk risk : risks) {
            List<RiskValue> values = riskValueRepository.findByRiskIdOrderByRecordedAtAsc(risk.getId());
            for (RiskValue value : values) {
                sb.append(csv(risk.getName())).append(',')
                        .append(csv(risk.getCategory())).append(',')
                        .append(csv(format(value.getRecordedAt()))).append(',')
                        .append(csv(format(value.getValue()))).append(',')
                        .append(LEVEL_NAMES[RiskSeverity.rank(risk, value.getValue())]).append('\n');
            }
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String format(Instant instant) {
        return instant == null ? "" : instant.toString();
    }

    private static String format(BigDecimal value) {
        return value == null ? "" : value.toPlainString();
    }

    // quote and escape a CSV field so commas/quotes in names don't break columns
    private static String csv(String field) {
        String s = field == null ? "" : field;
        return '"' + s.replace("\"", "\"\"") + '"';
    }
}
