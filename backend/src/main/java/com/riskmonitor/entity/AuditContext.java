package com.riskmonitor.entity;

import com.riskmonitor.service.UserResolver;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuditContext {

    private static UserResolver resolver;

    private final UserResolver userResolver;

    @PostConstruct
    void init() {
        AuditContext.resolver = userResolver;
    }

    static String currentUser() {
        if (resolver == null) {
            throw new IllegalStateException(
                    "AuditContext has not been initialized. Spring did not run @PostConstruct");
        }
        return resolver.resolve();
    }
}