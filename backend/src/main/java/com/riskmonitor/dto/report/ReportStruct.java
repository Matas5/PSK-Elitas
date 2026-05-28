package com.riskmonitor.dto.report;

import java.time.Instant;
import java.util.UUID;

import com.riskmonitor.entity.Report;

import jakarta.validation.constraints.NotBlank;

public final class ReportStruct {

    private ReportStruct() {
    }

    public record ReportResp(
            UUID id,
            String fileName,
            String contentType,
            ReportType reportType,
            ReportStatus status,
            long sizeBytes,
            Instant createdAt
    ) {
        public static ReportResp from(Report report) {
            return new ReportResp(
                    report.getId(),
                    report.getFileName(),
                    report.getContentType(),
                    report.getReportType(),
                    report.getStatus(),
                    report.getSizeBytes(),
                    report.getCreatedAt()
            );
        }
    }

    // chart PNG sent from the browser; dataBase64 may be a data URL or raw base64
    public record PngUploadReq(
            @NotBlank String fileName,
            @NotBlank String dataBase64
    ) {}
}
