package com.riskmonitor.service;

import com.riskmonitor.dto.risk.RiskStruct.RiskPeriod;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.CreateBatchReq;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.EntryReq;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.entity.RiskValue;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RiskValueService {

    private final RiskValueRepository riskValueRepository;
    private final RiskRepository riskRepository;

    @Transactional(readOnly = true)
    public List<RiskValue> listValues(UUID riskId) {
        if (!riskRepository.existsById(riskId)) {
            throw new IllegalArgumentException("Risk not found: " + riskId);
        }
        return riskValueRepository.findByRiskIdOrderByRecordedAtAsc(riskId);
    }

    @Transactional
    public List<RiskValue> createValues(UUID riskId, CreateBatchReq request) {
        Risk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + riskId));

        Set<Instant> seen = new HashSet<>();
        List<RiskValue> toSave = new ArrayList<>(request.entries().size());

        for (int i = 0; i < request.entries().size(); i++) {
            EntryReq entry = request.entries().get(i);
            Instant recordedAt = entry.recordedAt();

            if (!seen.add(recordedAt)) {
                throw new IllegalArgumentException(
                        "Entry " + i + ": duplicate recordedAt within batch (" + recordedAt + ")");
            }
            validateWithinValidityWindow(risk, recordedAt, i);
            validateOnGrid(risk, recordedAt, i);

            toSave.add(new RiskValue(risk, entry.value(), recordedAt));
        }

        return riskValueRepository.saveAll(toSave);
    }

    private void validateWithinValidityWindow(Risk risk, Instant recordedAt, int index) {
        if (recordedAt.isBefore(risk.getValidFrom())) {
            throw new IllegalArgumentException(
                    "Entry " + index + ": recordedAt is before risk validFrom");
        }
        if (risk.getValidUntil() != null && recordedAt.isAfter(risk.getValidUntil())) {
            throw new IllegalArgumentException(
                    "Entry " + index + ": recordedAt is after risk validUntil");
        }
    }

    private void validateOnGrid(Risk risk, Instant recordedAt, int index) {
        RiskPeriod unit = risk.getTimeIntervalUnit();
        long step = risk.getTimeIntervalValue();
        Instant validFrom = risk.getValidFrom();

        boolean aligned = switch (unit) {
            case SECOND  -> alignedFixed(validFrom, recordedAt, step * 1_000L);
            case MINUTE  -> alignedFixed(validFrom, recordedAt, step * 60_000L);
            case HOUR    -> alignedFixed(validFrom, recordedAt, step * 3_600_000L);
            case DAY     -> alignedCalendar(validFrom, recordedAt, ChronoUnit.DAYS, step);
            case MONTH   -> alignedCalendar(validFrom, recordedAt, ChronoUnit.MONTHS, step);
            case QUARTER -> alignedCalendar(validFrom, recordedAt, ChronoUnit.MONTHS, step * 3L);
            case YEAR    -> alignedCalendar(validFrom, recordedAt, ChronoUnit.YEARS, step);
        };

        if (!aligned) {
            throw new IllegalArgumentException(
                    "Entry " + index + ": recordedAt does not align with the risk's "
                            + step + " " + unit + " interval anchored at " + validFrom);
        }
    }

    private boolean alignedFixed(Instant validFrom, Instant recordedAt, long stepMillis) {
        long delta = recordedAt.toEpochMilli() - validFrom.toEpochMilli();
        return delta >= 0 && delta % stepMillis == 0;
    }

    // Calendar alignment in UTC. The plus(diff, unit).equals(to) check guards against
    // day-of-month drift (e.g., Jan 31 + 1 month = Feb 28 in Java, but Feb 28 does not
    // align with a Jan-31 anchor — see incident note A1).
    private boolean alignedCalendar(Instant validFrom, Instant recordedAt, ChronoUnit unit, long step) {
        LocalDateTime from = LocalDateTime.ofInstant(validFrom, ZoneOffset.UTC);
        LocalDateTime to = LocalDateTime.ofInstant(recordedAt, ZoneOffset.UTC);
        long diff = unit.between(from, to);
        if (diff < 0 || diff % step != 0) {
            return false;
        }
        return from.plus(diff, unit).equals(to);
    }
}
