package com.riskmonitor.dto.report;

// PENDING while the async job runs, then READY (or FAILED)
public enum ReportStatus {
    PENDING,
    READY,
    FAILED
}
