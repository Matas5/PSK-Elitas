package com.riskmonitor.exception;

import java.util.UUID;

/**
 * Exception thrown when optimistic locking conflict is detected.
 * Contains the current version and data from the server.
 */
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
