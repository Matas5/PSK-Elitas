# Extensibility / Glass-box Extensibility

Requirement: Swap and or decorate code without modifying or recompiling the existing code. Done via **Strategy** (CDI Alternatives / `@Specializes`) or **Decorator** (CDI Decorators), but in Spring it's done with `@Primary` and `@Profile` selecting between sibling beans to accomplish the same pattern.

---

## Strategy Interface

**File:** [backend/src/main/java/com/riskmonitor/service/auth/AuthenticationStrategy.java](backend/src/main/java/com/riskmonitor/service/auth/AuthenticationStrategy.java)

```java
public interface AuthenticationStrategy {

    String resolveUserId(HttpServletRequest request);
}
```

**How it works:** A single seam - every place that needs the current user ID depends on this interface, never on a concrete implementation.

---

## Default Implementation

### Header strategy (active by default)
**File:** [backend/src/main/java/com/riskmonitor/service/auth/HeaderUserIdAuthenticationStrategy.java](backend/src/main/java/com/riskmonitor/service/auth/HeaderUserIdAuthenticationStrategy.java)

```java
@Service
public class HeaderUserIdAuthenticationStrategy implements AuthenticationStrategy {

    @Override
    public String resolveUserId(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Missing X-User-Id header");
        }
        return userId;
    }
}
```

**How it works:** Standalone `@Service`. Selected when no other strategy is marked `@Primary` for the active profile.

---

## Alternative / Decorating Implementation

### Local-session strategy - `@Primary` + `@Profile("local")`
**File:** [backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java](backend/src/main/java/com/riskmonitor/service/auth/LocalSessionAuthenticationStrategy.java)

```java
@Service
@Primary
@Profile("local")
public class LocalSessionAuthenticationStrategy
        extends HeaderUserIdAuthenticationStrategy {

    private final AppUserRepository userRepository;

    public LocalSessionAuthenticationStrategy(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public String resolveUserId(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            throw new IllegalArgumentException("Missing X-User-Id header");
        }
        UUID userId;
        try {
            userId = UUID.fromString(header.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Malformed X-User-Id header: not a UUID");
        }
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Unknown local user: " + userId);
        }
        return userId.toString();
    }
}
```

**How it works:**

- `@Profile("local")` - only registered when the `local` profile is active.
- `@Primary` - when present, Spring picks this bean over the default header strategy for injection.
- `extends HeaderUserIdAuthenticationStrategy` - demonstrates the **Decorator/Specialization** angle: new behavior is added by extending the existing strategy, not by editing it.

---

## Consumer is Blind to the Concrete Strategy

**File:** [backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java](backend/src/main/java/com/riskmonitor/web/CurrentUserIdArgumentResolver.java)

```java
@Component
@RequiredArgsConstructor
public class CurrentUserIdArgumentResolver implements HandlerMethodArgumentResolver {

    private final AuthenticationStrategy authenticationStrategy;

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            throw new IllegalStateException("No HttpServletRequest available");
        }
        return authenticationStrategy.resolveUserId(request);
    }
}
```

**How it works:** Every controller method using `@CurrentUserId` is routed through this resolver. The resolver injects only the `AuthenticationStrategy` *interface* - Spring picks the right implementation based on the active profile. **No controller, service, or repository code knows which strategy is in use**, so adding a third strategy (e.g. `JwtAuthenticationStrategy`) only requires writing a new class - never editing the existing ones.

---

## Configuration Switches the Algorithm

**File:** [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties)

```properties
# SPECIALIZATION DEMO: COMMENT -> DEFAULT (HEADER) STRATEGY, UNCOMMENT -> LOCAL LOGIN
spring.profiles.active=local
```

**How it works:** Flipping a single line in config - **no recompile, no source edit** - swaps the entire authentication algorithm:

- `spring.profiles.active=local` → `LocalSessionAuthenticationStrategy` (DB-backed UUID).
- (commented out) → `HeaderUserIdAuthenticationStrategy` (raw `X-User-Id` header, used when authenticating via the Google OAuth flow).

---

## Adding a Third Variant (Potential extension)

To add e.g. a JWT-based strategy, the **only** change needed is a new file:

```java
@Service
@Primary
@Profile("jwt")
public class JwtAuthenticationStrategy implements AuthenticationStrategy {
    @Override
    public String resolveUserId(HttpServletRequest request) {
        // decode bearer token, return subject
    }
}
```

Then set `spring.profiles.active=jwt`. The existing two strategies, the resolver, controllers, services remain untouched and uncompiled.
