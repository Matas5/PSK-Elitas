package com.riskmonitor.dto;

import java.io.Serializable;
import java.util.UUID;

/**
 * Response returned when an optimistic locking conflict occurs (HTTP 409 Conflict).
 * Contains the current server version of the data so user can decide how to proceed.
 */
public record ConflictResponse<T>(
        String message,
        String error,
        UUID resourceId,
        Long expectedVersion,
        Long currentVersion,
        T currentData
) implements Serializable {

    public static <T> ConflictResponse<T> of(
            String resourceId,
            Long expectedVersion,
            Long currentVersion,
            T currentData
    ) {
        return new ConflictResponse<>(
                "Version mismatch: another user has modified this resource",
                "CONFLICT_VERSION_MISMATCH",
                UUID.fromString(resourceId),
                expectedVersion,
                currentVersion,
                currentData
        );
    }

    public static <T> ConflictResponse<T> of(
            UUID resourceId,
            Long expectedVersion,
            Long currentVersion,
            T currentData
    ) {
        return new ConflictResponse<>(
                "Version mismatch: another user has modified this resource",
                "CONFLICT_VERSION_MISMATCH",
                resourceId,
                expectedVersion,
                currentVersion,
                currentData
        );
    }
}
