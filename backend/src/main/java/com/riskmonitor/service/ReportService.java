package com.riskmonitor.service;

import java.time.Instant;
import java.time.ZoneOffset;
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

    private static final DateTimeFormatter STAMP =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").withZone(ZoneOffset.UTC);

    private final ReportRepository reportRepository;
    private final TeamService teamService;
    private final ReportGenerator reportGenerator;

    // not @Transactional: we save (and commit) the PENDING row first, THEN fire the async job,
    // so the worker thread is guaranteed to see the committed row.
    public Report requestCsv(String userId, UUID teamId) {
        teamService.assertUserIsTeamMember(teamId, userId);
        String fileName = "risk-report-" + STAMP.format(Instant.now()) + ".csv";
        Report report = reportRepository.save(
                new Report(userId, teamId, fileName, "text/csv", ReportType.RISK_CSV, ReportStatus.PENDING));
        reportGenerator.generateCsvAsync(report.getId());
        return report;
    }

    @Transactional
    public Report saveUploadedPng(String userId, UUID teamId, String fileName, byte[] bytes) {
        teamService.assertUserIsTeamMember(teamId, userId);
        Report report = new Report(userId, teamId, ensurePngName(fileName), "image/png",
                ReportType.CHART_PNG, ReportStatus.READY);
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

    private static String ensurePngName(String fileName) {
        String name = (fileName == null || fileName.isBlank()) ? "chart" : fileName.trim();
        return name.toLowerCase().endsWith(".png") ? name : name + ".png";
    }
}
