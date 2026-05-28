package com.riskmonitor.service;

import com.riskmonitor.dto.risk.RiskStruct.RiskPeriod;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.CreateBatchReq;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.EntryReq;
import com.riskmonitor.config.SystemProperties;
import com.riskmonitor.entity.AuditContext;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.entity.RiskValue;
import com.riskmonitor.entity.Team;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import com.riskmonitor.repository.TeamMemberRepository;
import com.riskmonitor.repository.TeamRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RiskValueServiceTests {

    @Test
    void createValuesAllowsTimestampsBetweenConfiguredLoggingIntervals() {
        initializeAuditContext();

        UUID riskId = UUID.randomUUID();
        Instant validFrom = Instant.parse("2026-05-21T09:00:00Z");
        Team team = new Team("Test team", "RM-TEST1", "google-user-1");
        Risk risk = new Risk(
                team,
                "google-user-1",
                "Test risk",
                "Operational",
                null,
                1L,
                RiskPeriod.HOUR,
                "%",
                null,
                null,
                BigDecimal.valueOf(50),
                BigDecimal.valueOf(80),
                validFrom,
                null
        );
        Instant recordedAt = Instant.parse("2026-05-21T09:30:00Z");
        List<RiskValue> captured = new ArrayList<>();

        RiskRepository riskRepository = repositoryProxy(
                RiskRepository.class,
                (proxy, method, args) -> {
                    if (method.getName().equals("findById")) {
                        return Optional.of(risk);
                    }
                    if (method.getName().equals("findByIdAndUserId")) {
                        return Optional.of(risk);
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
        RiskValueRepository riskValueRepository = repositoryProxy(
                RiskValueRepository.class,
                (proxy, method, args) -> {
                    if (method.getName().equals("saveAll")) {
                        for (Object value : (Iterable<?>) args[0]) {
                            captured.add(RiskValue.class.cast(value));
                        }
                        return args[0];
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
        TeamRepository teamRepository = repositoryProxy(
                TeamRepository.class,
                (proxy, method, args) -> {
                    if (method.getName().equals("existsById")) {
                        return true;
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
        TeamMemberRepository teamMemberRepository = repositoryProxy(
                TeamMemberRepository.class,
                (proxy, method, args) -> {
                    if (method.getName().equals("existsByTeamIdAndUserId")) {
                        return true;
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
        TeamService teamService = new TeamService(teamRepository, teamMemberRepository);

        RiskValueService riskValueService = new RiskValueService(riskValueRepository, riskRepository, teamService);
        List<RiskValue> saved = riskValueService.createValues(
                riskId,
                "google-user-1",
                new CreateBatchReq(List.of(new EntryReq(BigDecimal.valueOf(9), recordedAt)))
        );

        assertThat(saved).hasSize(1);
        assertThat(captured).hasSize(1);
        assertThat(captured.get(0).getRecordedAt()).isEqualTo(recordedAt);
    }

    @SuppressWarnings("unchecked")
    private static <T> T repositoryProxy(Class<T> repositoryType, java.lang.reflect.InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(
                repositoryType.getClassLoader(),
                new Class<?>[]{repositoryType},
                handler
        );
    }

    private static void initializeAuditContext() {
        try {
            AuditContext auditContext = new AuditContext(new UserResolver(new SystemProperties("test")));
            Method init = AuditContext.class.getDeclaredMethod("init");
            init.setAccessible(true);
            init.invoke(auditContext);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("Failed to initialize audit context for test", ex);
        }
    }
}
