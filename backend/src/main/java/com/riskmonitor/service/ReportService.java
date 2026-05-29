package com.riskmonitor.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.riskmonitor.dto.report.ReportStatus;
import com.riskmonitor.dto.report.ReportType;
import com.riskmonitor.entity.Report;
import com.riskmonitor.repository.ReportRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    // local-time stamp for filenames (server time zone), not UTC
    private static final DateTimeFormatter STAMP =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss").withZone(ZoneId.systemDefault());

    private final ReportRepository reportRepository;
    private final TeamService teamService;
    private final ReportGenerator reportGenerator;

    // save the PENDING row first so it's committed before we fire the async job,
    // otherwise the worker could look it up before it exists. that's why this isn't @Transactional.
    public Report requestCsv(String userId, UUID teamId, String strategyName) {
        teamService.assertUserIsTeamMember(teamId, userId);
        String fileName = "risk-summary-" + STAMP.format(Instant.now()) + ".csv";
        Report report = reportRepository.save(
                new Report(userId, teamId, fileName, "text/csv", ReportType.RISK_CSV, ReportStatus.PENDING));
        reportGenerator.generateCsvAsync(report.getId(), strategyName);
        return report;
    }

    @Transactional
    public Report saveUploaded(String userId, UUID teamId, String fileName, byte[] bytes,
                               ReportType reportType, String contentType) {
        teamService.assertUserIsTeamMember(teamId, userId);
        String name = (fileName == null || fileName.isBlank()) ? "export" : fileName.trim();
        Report report = new Report(userId, teamId, name, contentType, reportType, ReportStatus.READY);
        report.markReady(bytes);
        return reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public List<Report> list(String userId, UUID teamId) {
        teamService.assertUserIsTeamMember(teamId, userId);
        return reportRepository.findAllByUserIdAndTeamIdOrderByCreatedAtDesc(userId, teamId);
    }

    @Transactional(readOnly = true)
    public Report download(UUID id, String userId) {
        return reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
    }

    @Transactional
    public void delete(UUID id, String userId) {
        Report report = reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        reportRepository.delete(report);
    }
}
