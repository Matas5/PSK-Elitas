package com.riskmonitor.controller;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.riskmonitor.dto.report.ReportStatus;
import com.riskmonitor.dto.report.ReportType;
import com.riskmonitor.dto.report.ReportStruct.UploadReq;
import com.riskmonitor.dto.report.ReportStruct.ReportResp;
import com.riskmonitor.entity.Report;
import com.riskmonitor.service.ReportService;
import com.riskmonitor.web.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // returns 202 immediately; the CSV is built on an async thread, the page polls for READY
    @PostMapping("/csv")
    public ResponseEntity<ReportResp> generateCsv(@RequestParam UUID teamId,
                                                  @RequestParam(required = false) String strategy,
                                                  @CurrentUserId String userId) {
        Report report = reportService.requestCsv(userId, teamId, strategy);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ReportResp.from(report));
    }

    @PostMapping("/upload")
    public ResponseEntity<ReportResp> upload(
            @RequestParam UUID teamId,
            @Valid @RequestBody UploadReq request,
            @CurrentUserId String userId
    ) {
        byte[] bytes = decodeBase64(request.dataBase64());
        boolean csv = "csv".equalsIgnoreCase(request.kind());
        Report report = reportService.saveUploaded(userId, teamId, request.fileName(), bytes,
                csv ? ReportType.RISK_CSV : ReportType.CHART_PNG,
                csv ? "text/csv" : "image/png");
        return ResponseEntity.status(HttpStatus.CREATED).body(ReportResp.from(report));
    }

    @GetMapping
    public List<ReportResp> list(@RequestParam UUID teamId, @CurrentUserId String userId) {
        return reportService.list(userId, teamId).stream().map(ReportResp::from).toList();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable UUID id, @CurrentUserId String userId) {
        Report report = reportService.download(id, userId);
        if (report.getStatus() != ReportStatus.READY || report.getData() == null) {
            throw new IllegalArgumentException("Report is not ready for download");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(report.getContentType()))
                .body(report.getData());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @CurrentUserId String userId) {
        reportService.delete(id, userId);
    }

    // accepts a raw base64 string or a "data:image/png;base64,..." data URL
    private static byte[] decodeBase64(String value) {
        int comma = value.indexOf(',');
        String base64 = comma >= 0 ? value.substring(comma + 1) : value;
        return Base64.getDecoder().decode(base64);
    }
}
