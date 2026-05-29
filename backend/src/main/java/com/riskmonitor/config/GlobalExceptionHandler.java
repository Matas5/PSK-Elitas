package com.riskmonitor.config;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.riskmonitor.dto.ConflictResponse;
import com.riskmonitor.exception.OptimisticLockingConflictException;

import lombok.RequiredArgsConstructor;

// maps domain + JPA exceptions to HTTP responses for every controller
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // version check failed: return 409 with the current server copy so the client can reload or overwrite
    @ExceptionHandler(OptimisticLockingConflictException.class)
    public ResponseEntity<ConflictResponse<?>> handleOptimisticLockingFailure(
            OptimisticLockingConflictException ex
    ) {
        log.warn("Optimistic locking conflict: {}", ex.getMessage());

        ConflictResponse<?> response = ConflictResponse.of(
                ex.getResourceId(),
                null,
                ex.getCurrentVersion(),
                ex.getCurrentData()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    // flush-time JPA lock failure: the safety net if a true concurrent race slips past the explicit
    // version check, so the @Version bump failing at flush still answers 409 (reload), not 500.
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ConflictResponse<?>> handleJpaOptimisticLock(
            ObjectOptimisticLockingFailureException ex
    ) {
        log.warn("JPA optimistic lock conflict: {}", ex.getMessage());
        UUID id = (ex.getIdentifier() instanceof UUID u) ? u : null;
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ConflictResponse<>(
                "This record was modified by another user. Please reload.",
                "CONFLICT_VERSION_MISMATCH", id, null, null, null));
    }

    // bad input -> 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new ErrorResponse(ex.getMessage(), "VALIDATION_ERROR")
        );
    }

    public record ErrorResponse(String message, String error) {}
}
