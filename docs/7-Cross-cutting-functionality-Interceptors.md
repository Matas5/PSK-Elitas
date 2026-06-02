# Cross-cutting functionality/Interceptors

**Description:**
Visi dalykinio funkcionalumo (business logic) veiksmai privalo būti žurnalizuojami (fiksuojami faile arba DB), įrašant naudotojo vardą, teises, laiką, vykdomą metodą (klasės pavadinimas + metodo pavadinimas). Tam, kad žurnalizavimo kodą įjungti/išjungti/pakeisti, neturi reikėti modifikuoti/perkompiliuoti stebimo sistemos kodo:
- Java EE/CDI Interceptors

**Implementation:**
Every business action is logged (user, authorities, time, class.method) with no logging code in the services, and can be toggled by config.

## Logging aspect

**File:** [backend/src/main/java/com/riskmonitor/audit/BusinessOperationLoggingAspect.java](../backend/src/main/java/com/riskmonitor/audit/BusinessOperationLoggingAspect.java)
**Lines:** 17-60

An `@Around` aspect wraps every method in `com.riskmonitor.service..*` and logs before/after. Service code is untouched.

```java
@Aspect
@Component
@ConditionalOnProperty(prefix = "risk-monitor.audit", name = "enabled",
                       havingValue = "true", matchIfMissing = true)
public class BusinessOperationLoggingAspect {

    @Around("execution(* com.riskmonitor.service..*(..)) "
            + "&& !within(com.riskmonitor.service.UserResolver)")
    public Object logBusinessOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        String username = resolveUsername();
        String authorities = resolveAuthorities();
        // ... logs START / SUCCESS / FAILURE with user, authorities, time, class.method ...
    }
}
```

## AOP enabled

**File:** [backend/src/main/java/com/riskmonitor/config/AopConfig.java](../backend/src/main/java/com/riskmonitor/config/AopConfig.java)
**Lines:** 6-8

```java
@Configuration
@EnableAspectJAutoProxy
public class AopConfig {
}
```

## Real user in the log

**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java](../backend/src/main/java/com/riskmonitor/web/CurrentUserAuthFilter.java)
**Lines:** 18-37

A filter puts the per-request `X-User-Id` into `SecurityContextHolder` (authority `ROLE_USER`) before the controller, and clears it after so a pooled thread can't leak it.

```java
@Component
public class CurrentUserAuthFilter extends OncePerRequestFilter {
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

## Toggle without touching business code

**File:** [backend/src/main/resources/application.properties](../backend/src/main/resources/application.properties)
**Lines:** 20

Setting this `false` disables the aspect (`@ConditionalOnProperty`), no service/controller change.

```properties
risk-monitor.audit.enabled=true
```

## File-based logging

**File:** [backend/src/main/resources/logback-spring.xml](../backend/src/main/resources/logback-spring.xml)
**Lines:** 25-27

The `BUSINESS_AUDIT` logger writes to `logs/business-operations.log` (rotated daily) and the console.

```xml
<logger name="BUSINESS_AUDIT" level="INFO" additivity="false">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="BUSINESS_AUDIT_FILE"/>
</logger>
```
