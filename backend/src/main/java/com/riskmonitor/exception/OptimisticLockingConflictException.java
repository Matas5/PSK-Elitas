package com.riskmonitor.exception;

import java.util.UUID;

// thrown on a version mismatch; carries the current server version + data for the 409 response
public class OptimisticLockingConflictException extends RuntimeException {
    private final UUID resourceId;
    private final Long currentVersion;
    private final Object currentData;

    public OptimisticLockingConflictException(
            String message,
            UUID resourceId,
            Long currentVersion,
            Object currentData
    ) {
        super(message);
        this.resourceId = resourceId;
        this.currentVersion = currentVersion;
        this.currentData = currentData;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public Long getCurrentVersion() {
        return currentVersion;
    }

    public Object getCurrentData() {
        return currentData;
    }
}
