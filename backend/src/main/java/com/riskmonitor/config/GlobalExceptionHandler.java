package com.riskmonitor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.riskmonitor.dto.ConflictResponse;
import com.riskmonitor.exception.OptimisticLockingConflictException;

import lombok.RequiredArgsConstructor;

/**
 * Global exception handler for REST controllers.
 * Handles optimistic locking conflicts and other common exceptions.
 */
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle optimistic locking failures when multiple users try to update the same resource.
     * Returns 409 Conflict with the current version of the data.
     */
    @ExceptionHandler(OptimisticLockingConflictException.class)
    public ResponseEntity<ConflictResponse<?>> handleOptimisticLockingFailure(
            OptimisticLockingConflictException ex
    ) {
        log.warn("Optimistic locking conflict: {}", ex.getMessage());

        ConflictResponse<?> response = ConflictResponse.of(
                ex.getResourceId(),
                null, // Client version is not known to exception handler
                ex.getCurrentVersion(),
                ex.getCurrentData()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle generic IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                new ErrorResponse(ex.getMessage(), "VALIDATION_ERROR")
        );
    }

    public record ErrorResponse(String message, String error) {}
}
