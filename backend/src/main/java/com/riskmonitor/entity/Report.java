package com.riskmonitor.entity;

import java.time.Instant;
import java.util.UUID;

import com.riskmonitor.dto.report.ReportStatus;
import com.riskmonitor.dto.report.ReportType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "report")
public class Report {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 20)
    private ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReportStatus status;

    // stored as bytea (plain byte[], not @Lob, so Hibernate doesn't use a Postgres large object)
    @Column(name = "data")
    private byte[] data;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Report() {
        // JPA
    }

    public Report(String userId, UUID teamId, String fileName, String contentType,
                  ReportType reportType, ReportStatus status) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.teamId = teamId;
        this.fileName = fileName;
        this.contentType = contentType;
        this.reportType = reportType;
        this.status = status;
        this.sizeBytes = 0;
        this.createdAt = Instant.now();
    }

    public void markReady(byte[] bytes) {
        this.data = bytes;
        this.sizeBytes = bytes == null ? 0 : bytes.length;
        this.status = ReportStatus.READY;
    }

    public void markFailed() {
        this.status = ReportStatus.FAILED;
    }

    public UUID getId() { return id; }
    public String getUserId() { return userId; }
    public UUID getTeamId() { return teamId; }
    public String getFileName() { return fileName; }
    public String getContentType() { return contentType; }
    public ReportType getReportType() { return reportType; }
    public ReportStatus getStatus() { return status; }
    public byte[] getData() { return data; }
    public long getSizeBytes() { return sizeBytes; }
    public Instant getCreatedAt() { return createdAt; }
}
