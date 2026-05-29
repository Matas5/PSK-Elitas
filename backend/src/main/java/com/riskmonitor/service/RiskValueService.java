package com.riskmonitor.service;

import com.riskmonitor.dto.riskvalue.RiskValueStruct.CreateBatchReq;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.EntryReq;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.Resp;
import com.riskmonitor.dto.riskvalue.RiskValueStruct.UpdateReq;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.entity.RiskValue;
import com.riskmonitor.exception.OptimisticLockingConflictException;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final TeamService teamService;

    @Transactional(readOnly = true)
    public List<RiskValue> listValues(UUID riskId, String userId) {
        getRiskForUser(riskId, userId);
        return riskValueRepository.findByRiskIdOrderByRecordedAtAsc(riskId);
    }

    @Transactional(readOnly = true)
    public Page<RiskValue> listValues(UUID riskId, String userId, Pageable pageable) {
        getRiskForUser(riskId, userId);
        return riskValueRepository.findByRiskId(riskId, pageable);
    }

    @Transactional
    public List<RiskValue> createValues(UUID riskId, String userId, CreateBatchReq request) {
        Risk risk = getRiskForUser(riskId, userId);

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

            toSave.add(new RiskValue(risk, entry.value(), recordedAt));
        }

        return riskValueRepository.saveAll(toSave);
    }

    @Transactional
    public RiskValue updateValue(UUID riskId, String userId, UUID valueId, UpdateReq request) {
        RiskValue riskValue = getValueForRisk(riskId, userId, valueId);
        // optimistic locking: reject edits made against a stale version (same flow as RiskService)
        if (!riskValue.getVersion().equals(request.version())) {
            throw new OptimisticLockingConflictException(
                    "Risk value " + valueId + " was modified by another user",
                    valueId, riskValue.getVersion(), Resp.from(riskValue));
        }
        validateWithinValidityWindow(riskValue.getRisk(), request.recordedAt(), 0);
        riskValue.update(request.value(), request.recordedAt());
        return riskValueRepository.save(riskValue);
    }

    @Transactional
    public void deleteValue(UUID riskId, String userId, UUID valueId) {
        RiskValue riskValue = getValueForRisk(riskId, userId, valueId);
        riskValueRepository.delete(riskValue);
    }

    private RiskValue getValueForRisk(UUID riskId, String userId, UUID valueId) {
        getRiskForUser(riskId, userId);
        return riskValueRepository.findByIdAndRiskId(valueId, riskId)
                .orElseThrow(() -> new IllegalArgumentException("Risk value not found: " + valueId));
    }

    private Risk getRiskForUser(UUID riskId, String userId) {
        Risk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + riskId));
        teamService.assertUserCanAccessRisk(risk, userId);
        return risk;
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
}
