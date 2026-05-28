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

        if (!riskRepo.findAllByUserId(demoUserId, Sort.unsorted()).isEmpty()) {
            log.info("Demo data already present for user {}, skipping seed", demoUserId);
            return;
        }

        Instant validFrom = Instant.now().minus(60, ChronoUnit.DAYS);

        // personal "My Risks" team
        Team mine = ensureTeam(demoUserId, "My Risks", true, "RM-MINE");
        seedRisks(validFrom, List.of(
                new Risk(mine, demoUserId, "Personal commute time", "Personal",
                        "Door-to-door commute minutes.",
                        1L, RiskPeriod.DAY, "min",
                        null, null, new BigDecimal("45.0000"), new BigDecimal("90.0000"),
                        validFrom, null),
                new Risk(mine, demoUserId, "Inbox unread count", "Personal",
                        "Unread items sitting in the inbox.",
                        1L, RiskPeriod.DAY, "emails",
                        null, null, new BigDecimal("50.0000"), new BigDecimal("200.0000"),
                        validFrom, null)
        ), new int[][] {
                {0, 1, 2, 1, 0, 1, 2, 1, 1, 0, 1, 2, 1, 0, 0},
                {0, 0, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 0, 0, 1},
        });

        // shared "Demo Risk Team" (the ranking-strategy showcase data)
        Team demoTeam = ensureTeam(demoUserId, "Demo Risk Team", false, "RM-DEMO");
        seedRisks(validFrom, List.of(
                new Risk(demoTeam, demoUserId, "Population density under drone route", "Aerial operations",
                        "Estimated population density along the planned drone flight corridor.",
                        1L, RiskPeriod.DAY, "people/km^2",
                        null, null, new BigDecimal("500.0000"), new BigDecimal("5000.0000"),
                        validFrom, null),
                new Risk(demoTeam, demoUserId, "API response latency (P95)", "Platform reliability",
                        "95th-percentile end-to-end response time for the primary API.",
                        1L, RiskPeriod.HOUR, "ms",
                        null, null, new BigDecimal("300.0000"), new BigDecimal("1000.0000"),
                        validFrom, null),
                new Risk(demoTeam, demoUserId, "Supplier delivery delay", "Logistics",
                        "Days late versus the contracted delivery date for incoming shipments.",
                        1L, RiskPeriod.DAY, "days",
                        null, null, new BigDecimal("2.0000"), new BigDecimal("7.0000"),
                        validFrom, null),
                new Risk(demoTeam, demoUserId, "Monthly budget burn", "Finance",
                        "Cumulative monthly spend as a percentage of the allocated budget.",
                        1L, RiskPeriod.MONTH, "%",
                        null, null, new BigDecimal("80.0000"), new BigDecimal("100.0000"),
                        validFrom, null),
                new Risk(demoTeam, demoUserId, "Security incidents reported", "Information security",
                        "Confirmed security incidents reported per day across all environments.",
                        1L, RiskPeriod.DAY, "incidents",
                        null, null, new BigDecimal("3.0000"), new BigDecimal("10.0000"),
                        validFrom, null)
        ), new int[][] {
                {0, 1, 2, 2, 1, 2, 2, 1, 2, 2, 0, 2, 2, 2, 0}, // population density
                {0, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 0, 0}, // api latency
                {1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1}, // supplier delay
                {0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2}, // monthly budget burn
                {0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1}, // security incidents
        });

        // a second shared team
        Team platform = ensureTeam(demoUserId, "Platform Reliability Squad", false, "RM-PLAT");
        seedRisks(validFrom, List.of(
                new Risk(platform, demoUserId, "Error rate (5xx)", "Platform reliability",
                        "Share of requests returning a 5xx response.",
                        1L, RiskPeriod.HOUR, "%",
                        null, null, new BigDecimal("1.0000"), new BigDecimal("5.0000"),
                        validFrom, null),
                new Risk(platform, demoUserId, "Queue backlog", "Platform reliability",
                        "Pending jobs in the processing queue.",
                        1L, RiskPeriod.HOUR, "jobs",
                        null, null, new BigDecimal("500.0000"), new BigDecimal("2000.0000"),
                        validFrom, null)
        ), new int[][] {
                {0, 1, 1, 2, 2, 1, 2, 1, 2, 1, 1, 2, 1, 0, 1},
                {1, 1, 0, 1, 1, 2, 1, 1, 0, 1, 2, 1, 1, 1, 0},
        });

        log.info("Demo data seeded for user {}", demoUserId);
    }

    // find one of the demo user's teams by name, or create it (with an OWNER membership)
    private Team ensureTeam(String demoUserId, String name, boolean personal, String codeBase) {
        return teamMemberRepo.findAllByUserIdOrderByTeam_NameAsc(demoUserId).stream()
                .map(TeamMember::getTeam)
                .filter(team -> team.getName().equals(name))
                .findFirst()
                .orElseGet(() -> {
                    Team team = teamRepo.save(new Team(name, uniqueInviteCode(codeBase), demoUserId, personal));
                    teamMemberRepo.save(new TeamMember(team, demoUserId, TeamRole.OWNER));
                    return team;
                });
    }

    private String uniqueInviteCode(String base) {
        String code = base;
        int suffix = 2;
        while (teamRepo.existsByInviteCode(code)) {
            code = base + suffix;
            suffix += 1;
        }
        return code;
    }

    // saves the risks, then fills each with one reading per profile entry over the last 60 days
    private void seedRisks(Instant validFrom, List<Risk> risks, int[][] profiles) {
        List<Risk> saved = riskRepo.saveAll(risks);
        int points = profiles[0].length;
        long stepHours = (60L * 24) / points;
        List<RiskValue> values = new ArrayList<>(saved.size() * points);
        for (int r = 0; r < saved.size(); r++) {
            Risk risk = saved.get(r);
            int[] profile = profiles[r];
            for (int i = 0; i < profile.length; i++) {
                Instant when = validFrom.plus(stepHours * (long) i, ChronoUnit.HOURS);
                values.add(new RiskValue(risk, valueForSeverity(risk, profile[i]), when));
            }
        }
        valueRepo.saveAll(values);
    }

    // builds a reading that lands in the requested band for the risk's upper thresholds
    private static BigDecimal valueForSeverity(Risk risk, int severity) {
        BigDecimal upperMid = risk.getUpperMidThreshold();
        BigDecimal upperMax = risk.getUpperMaxThreshold();
        BigDecimal value = switch (severity) {
            case 2 -> upperMax.multiply(new BigDecimal("1.10")); // above max, lands HIGH
            case 1 -> upperMid.add(upperMax).divide(BigDecimal.valueOf(2)); // mid band, MEDIUM
            default -> upperMid.multiply(new BigDecimal("0.50")); // under mid, LOW
        };
        return value.setScale(4, RoundingMode.HALF_UP);
    }
}
