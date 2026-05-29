package com.riskmonitor.dto;

import java.io.Serializable;
import java.util.UUID;

// 409 body for a version conflict: carries the current server version + data so the client can reload or overwrite
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
