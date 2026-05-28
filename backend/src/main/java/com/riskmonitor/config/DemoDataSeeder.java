package com.riskmonitor.config;

import com.riskmonitor.dto.risk.RiskStruct.RiskPeriod;
import com.riskmonitor.entity.AppUser;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.entity.RiskValue;
import com.riskmonitor.entity.Team;
import com.riskmonitor.entity.TeamMember;
import com.riskmonitor.entity.TeamRole;
import com.riskmonitor.repository.AppUserRepository;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import com.riskmonitor.repository.TeamMemberRepository;
import com.riskmonitor.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "riskmonitor.seed.enabled", havingValue = "true")
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

    private static final String DEMO_USERNAME = "demo";
    private static final String DEMO_PASSWORD = "demo1234";

    private final AppUserRepository userRepo;
    private final RiskRepository riskRepo;
    private final RiskValueRepository valueRepo;
    private final TeamRepository teamRepo;
    private final TeamMemberRepository teamMemberRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        AppUser demoUser = userRepo.findByUsername(DEMO_USERNAME)
                .orElseGet(() -> userRepo.save(
                        new AppUser(DEMO_USERNAME, passwordEncoder.encode(DEMO_PASSWORD))
                ));

        String demoUserId = demoUser.getId().toString();
        Team demoTeam = teamMemberRepo.findAllByUserIdOrderByTeam_NameAsc(demoUserId).stream()
                .filter(member -> member.getRole() == TeamRole.OWNER)
                .map(TeamMember::getTeam)
                .findFirst()
                .orElseGet(() -> {
                    String inviteCode = "RM-DEMO1";
                    int suffix = 2;
                    while (teamRepo.existsByInviteCode(inviteCode)) {
                        inviteCode = "RM-DEMO" + suffix;
                        suffix += 1;
                    }
                    Team team = teamRepo.save(new Team("Demo Risk Team", inviteCode, demoUserId));
                    teamMemberRepo.save(new TeamMember(team, demoUserId, TeamRole.OWNER));
                    return team;
                });

        if (!riskRepo.findAllByTeamId(demoTeam.getId(), Sort.unsorted()).isEmpty()) {
            log.info("Demo data already present for team {}, skipping seed", demoTeam.getId());
            return;
        }

        Instant now = Instant.now();
        Instant validFrom = now.minus(60, ChronoUnit.DAYS);

        List<Risk> risks = List.of(
                new Risk(demoTeam, demoUserId,
                        "Population density under drone route",
                        "Aerial operations",
                        "Estimated population density along the planned drone flight corridor.",
                        1L, RiskPeriod.DAY, "people/km^2",
                        null, null,
                        new BigDecimal("500.0000"),
                        new BigDecimal("5000.0000"),
                        validFrom, null),

                new Risk(demoTeam, demoUserId,
                        "API response latency (P95)",
                        "Platform reliability",
                        "95th-percentile end-to-end response time for the primary API.",
                        1L, RiskPeriod.HOUR, "ms",
                        null, null,
                        new BigDecimal("300.0000"),
                        new BigDecimal("1000.0000"),
                        validFrom, null),

                new Risk(demoTeam, demoUserId,
                        "Supplier delivery delay",
                        "Logistics",
                        "Days late versus the contracted delivery date for incoming shipments.",
                        1L, RiskPeriod.DAY, "days",
                        null, null,
                        new BigDecimal("2.0000"),
                        new BigDecimal("7.0000"),
                        validFrom, null),

                new Risk(demoTeam, demoUserId,
                        "Monthly budget burn",
                        "Finance",
                        "Cumulative monthly spend as a percentage of the allocated budget.",
                        1L, RiskPeriod.MONTH, "%",
                        null, null,
                        new BigDecimal("80.0000"),
                        new BigDecimal("100.0000"),
                        validFrom, null),

                new Risk(demoTeam, demoUserId,
                        "Security incidents reported",
                        "Information security",
                        "Confirmed security incidents reported per day across all environments.",
                        1L, RiskPeriod.DAY, "incidents",
                        null, null,
                        new BigDecimal("3.0000"),
                        new BigDecimal("10.0000"),
                        validFrom, null)
        );

        List<Risk> savedRisks = riskRepo.saveAll(risks);

        double[] curve = {
                0.04, 0.08, 0.16, 0.28, 0.42, 0.62, 0.84,
                1.05, 1.15, 0.95, 0.72, 0.50, 0.30, 0.18, 0.10
        };
        long stepHours = (60L * 24) / curve.length;

        List<RiskValue> allValues = new ArrayList<>(savedRisks.size() * curve.length);
        for (Risk risk : savedRisks) {
            BigDecimal upperMax = risk.getUpperMaxThreshold();
            for (int i = 0; i < curve.length; i++) {
                Instant when = validFrom.plus(stepHours * (long) i, ChronoUnit.HOURS);
                BigDecimal value = upperMax
                        .multiply(BigDecimal.valueOf(curve[i]))
                        .setScale(4, RoundingMode.HALF_UP);
                allValues.add(new RiskValue(risk, value, when));
            }
        }

        valueRepo.saveAll(allValues);

        log.info("Demo data seeded: user={}, risks={}, values={}",
                demoUserId, savedRisks.size(), allValues.size());
    }
}
