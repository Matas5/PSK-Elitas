package com.riskmonitor.audit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.stream.Collectors;

@Aspect
@Component
@ConditionalOnProperty(
        prefix = "risk-monitor.audit",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class BusinessOperationLoggingAspect {

    private static final Logger auditLogger =
            LoggerFactory.getLogger("BUSINESS_AUDIT");

    @Around(
            "execution(* com.riskmonitor.service..*(..)) " +
                    "&& !within(com.riskmonitor.service.UserResolver)"
    )
    public Object logBusinessOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        String username = resolveUsername();
        String authorities = resolveAuthorities();
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        Instant startedAt = Instant.now();

        auditLogger.info(
                "BUSINESS_OPERATION_START user='{}' authorities='{}' time='{}' method='{}.{}'",
                username,
                authorities,
                startedAt,
                className,
                methodName
        );

        try {
            Object result = joinPoint.proceed();

            auditLogger.info(
                    "BUSINESS_OPERATION_SUCCESS user='{}' authorities='{}' time='{}' method='{}.{}'",
                    username,
                    authorities,
                    Instant.now(),
                    className,
                    methodName
            );

            return result;
        } catch (Throwable ex) {
            auditLogger.error(
                    "BUSINESS_OPERATION_FAILURE user='{}' authorities='{}' time='{}' method='{}.{}' error='{}'",
                    username,
                    authorities,
                    Instant.now(),
                    className,
                    methodName,
                    ex.getMessage()
            );

            throw ex;
        }
    }

    private String resolveUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return "anonymous";
        }

        return authentication.getName();
    }

    private String resolveAuthorities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getAuthorities() == null) {
            return "NO_AUTHORITIES";
        }

        String authorities = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return authorities.isBlank() ? "NO_AUTHORITIES" : authorities;
    }
}