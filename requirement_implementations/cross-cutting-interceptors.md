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

    @Around("execution(* com.riskmonitor.service..*(..))")
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
BUSINESS_OPERATION_START user='anonymousUser' authorities='ROLE_ANONYMOUS' time='2026-05-25T17:28:56Z' method='com.riskmonitor.service.RiskService.createRisk'
BUSINESS_OPERATION_SUCCESS user='anonymousUser' authorities='ROLE_ANONYMOUS' time='2026-05-25T17:28:56Z' method='com.riskmonitor.service.RiskService.createRisk'
```

**How it works:** Creating a risk triggers `RiskService.createRisk`, and the aspect logs both start and successful completion.

---

## Verification

- Business logic methods are logged automatically through Spring AOP.
- Logged data includes user, permissions, time, class name and method name.
- Logs are written to `logs/business-operations.log`.
- Logging can be enabled/disabled with `risk-monitor.audit.enabled`.
- Monitored service code does not need manual logging statements or recompilation.
