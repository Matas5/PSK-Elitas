# Cross-cutting Functionality / Interceptors

Requirement: All business logic actions must be logged to a file or database, including user name, permissions, time, and executed method name. Logging must be possible to enable, disable or change without modifying/recompiling the monitored business code.

---

## Spring AOP Interceptor

### Business Operation Logging Aspect
**File:** [backend/src/main/java/com/riskmonitor/audit/BusinessOperationLoggingAspect.java](backend/src/main/java/com/riskmonitor/audit/BusinessOperationLoggingAspect.java)

```java
@Aspect
@Component
@ConditionalOnProperty(
        prefix = "risk-monitor.audit",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class BusinessOperationLoggingAspect {

    @Around(
            "execution(* com.riskmonitor.service..*(..)) "
                    + "&& !within(com.riskmonitor.service.UserResolver)"
    )
    public Object logBusinessOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        String username = resolveUsername();
        String authorities = resolveAuthorities();
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        Instant startedAt = Instant.now();

        auditLogger.info(
                "BUSINESS_OPERATION_START user='{}' authorities='{}' time='{}' method='{}.{}'",
                username, authorities, startedAt, className, methodName
        );

        Object result = joinPoint.proceed();

        auditLogger.info(
                "BUSINESS_OPERATION_SUCCESS user='{}' authorities='{}' time='{}' method='{}.{}'",
                username, authorities, Instant.now(), className, methodName
        );

        return result;
    }
}
```

**How it works:** The aspect intercepts all methods in `com.riskmonitor.service..*`, which is the business logic layer. It logs the current user, permissions, timestamp, class name and method name before and after execution.

---

## AOP Configuration

### Enable Aspect Processing
**File:** [backend/src/main/java/com/riskmonitor/config/AopConfig.java](backend/src/main/java/com/riskmonitor/config/AopConfig.java)

```java
@Configuration
@EnableAspectJAutoProxy
public class AopConfig {
}
```

**How it works:** `@EnableAspectJAutoProxy` enables Spring AOP proxy creation, allowing the logging aspect to wrap service-layer methods.

---

## Real User In The Audit Log

### Per-request Authentication Filter
**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java](backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java)

```java
@Component
public class CurrentUserAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userId = request.getHeader("X-User-Id");
        if (userId != null && !userId.isBlank()) {
            var auth = new UsernamePasswordAuthenticationToken(
                    userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
```

**How it works:** the aspect reads the user and authorities from `SecurityContextHolder`. This filter puts the per-request `X-User-Id` there before the controller runs, so the audit log records the real user id (and a `ROLE_USER` authority) instead of the anonymous token. The context is cleared after each request so a pooled thread never carries the previous user. The app has no global role model, so authorities are the coarse `ROLE_USER`; per-team roles (OWNER/MEMBER) are enforced separately in `TeamService`.

---

## Enable / Disable Without Changing Business Code

### Application Properties
**File:** [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties)

```properties
risk-monitor.audit.enabled=true
```

**How it works:** Setting this value to `false` disables the audit aspect without changing `RiskService`, `RiskValueService`, controllers, or repositories.

---

## File-based Logging

### Logback Configuration
**File:** [backend/src/main/resources/logback-spring.xml](backend/src/main/resources/logback-spring.xml)

```xml
<logger name="BUSINESS_AUDIT" level="INFO" additivity="false">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="BUSINESS_AUDIT_FILE"/>
</logger>
```

**How it works:** Business operation logs are written to `logs/business-operations.log`. Older logs are rotated by date.

---

## Runtime Example

### Business Operation Log
**File:** [backend/logs/business-operations.log](backend/logs/business-operations.log)

```text
BUSINESS_OPERATION_START user='b3f1c2a4-...' authorities='ROLE_USER' time='2026-05-29T10:12:03Z' method='com.riskmonitor.service.RiskService.createRisk'
BUSINESS_OPERATION_SUCCESS user='b3f1c2a4-...' authorities='ROLE_USER' time='2026-05-29T10:12:03Z' method='com.riskmonitor.service.RiskService.createRisk'
```

**How it works:** Creating a risk triggers `RiskService.createRisk`, and the aspect logs both start and successful completion. The `user` is the real `X-User-Id` placed in the security context by `CurrentUserAuthFilter`.

---

## Verification

- Business logic methods are logged automatically through Spring AOP.
- Logged data includes user, permissions, time, class name and method name.
- Logs are written to `logs/business-operations.log`.
- Logging can be enabled/disabled with `risk-monitor.audit.enabled`.
- Monitored service code does not need manual logging statements or recompilation.
