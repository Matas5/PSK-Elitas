package com.riskmonitor.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.dto.risk.RiskStruct.RiskResp;
import com.riskmonitor.dto.risk.RiskStruct.RiskUpdateReq;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.exception.OptimisticLockingConflictException;
import com.riskmonitor.repository.RiskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final RiskRepository riskRepository;

    // for testing, use dto to avoid sending unnecessary fields
    @Transactional(readOnly = true)
    public Risk getRisk(UUID id, String googleUserId) {
        return riskRepository.findByIdAndGoogleUserId(id, googleUserId)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Risk> listRisks(String googleUserId) {
        return riskRepository.findAllByGoogleUserId(googleUserId, Sort.by(Sort.Direction.ASC, "name"));
    }

    @Transactional
    public Risk createRisk(RiskCreateReq req, String googleUserId) {
        validateSelectedBounds(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMidThreshold(),
                req.upperMaxThreshold(),
                req.lowerMidThreshold(),
                req.lowerMinThreshold()
        );
        validateThresholdOrdering(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMidThreshold(),
                req.upperMaxThreshold(),
                req.lowerMidThreshold(),
                req.lowerMinThreshold()
        );

        BigDecimal lowerMax = req.hasLowerBounds() ? req.lowerMinThreshold() : null;
        BigDecimal lowerMedium = req.hasLowerBounds() ? req.lowerMidThreshold() : null;
        BigDecimal upperMedium = req.hasUpperBounds() ? req.upperMidThreshold() : null;
        BigDecimal upperMax = req.hasUpperBounds() ? req.upperMaxThreshold() : null;

        Risk risk = new Risk(
                googleUserId,
                req.name().trim(),
                req.category().trim(),
                req.description(),
                req.timeIntervalValue(),
                req.timeIntervalUnit(),
                req.measurementUnit().trim(),
                lowerMax,
                lowerMedium,
                upperMedium,
                upperMax,
                req.validFrom(),
                req.validUntil()
        );

        return riskRepository.save(risk);
    }

    @Transactional
    public Risk updateRisk(UUID id, RiskUpdateReq req, String googleUserId) {
        validateSelectedBounds(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMidThreshold(),
                req.upperMaxThreshold(),
                req.lowerMidThreshold(),
                req.lowerMinThreshold()
        );
        validateThresholdOrdering(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMidThreshold(),
                req.upperMaxThreshold(),
                req.lowerMidThreshold(),
                req.lowerMinThreshold()
        );

        BigDecimal lowerMax = req.hasLowerBounds() ? req.lowerMinThreshold() : null;
        BigDecimal lowerMedium = req.hasLowerBounds() ? req.lowerMidThreshold() : null;
        BigDecimal upperMedium = req.hasUpperBounds() ? req.upperMidThreshold() : null;
        BigDecimal upperMax = req.hasUpperBounds() ? req.upperMaxThreshold() : null;

        Risk risk = getRisk(id, googleUserId);
        
        // Optimistic locking: check version match
        if (!risk.getVersion().equals(req.version())) {
            throw new OptimisticLockingConflictException(
                    "Risk with id " + id + " has been modified by another user",
                    risk.getId(),
                    risk.getVersion(),
                    RiskResp.from(risk)
            );
        }
        
        risk.update(new Risk.UpdateRiskFields(
                req.name().trim(),
                req.category().trim(),
                req.description(),
                req.timeIntervalValue(),
                req.timeIntervalUnit(),
                req.measurementUnit().trim(),
                lowerMax,
                lowerMedium,
                upperMedium,
                upperMax,
                req.validFrom(),
                req.validUntil()
        ));

        return riskRepository.save(risk);
    }

    @Transactional
    public void deleteRisk(UUID id, String googleUserId) {
        Risk risk = getRisk(id, googleUserId);
        riskRepository.delete(risk);
    }

    private void validateSelectedBounds(
            Boolean hasUpperBounds,
            Boolean hasLowerBounds,
            BigDecimal upperMediumThreshold,
            BigDecimal upperMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal lowerMaxThreshold
    ) {
        boolean hasUpper = Boolean.TRUE.equals(hasUpperBounds);
        boolean hasLower = Boolean.TRUE.equals(hasLowerBounds);

        if (!hasUpper && !hasLower) {
            throw new IllegalArgumentException(
                    "At least one of hasUpperBounds or hasLowerBounds must be true");
        }
        if (hasUpper
                && (upperMediumThreshold == null || upperMaxThreshold == null)) {
            throw new IllegalArgumentException(
                    "hasUpperBounds is true but upper threshold values are missing");
        }
        if (hasLower
                && (lowerMediumThreshold == null || lowerMaxThreshold == null)) {
            throw new IllegalArgumentException(
                    "hasLowerBounds is true but lower threshold values are missing");
        }
    }

    private void validateThresholdOrdering(
            Boolean hasUpperBounds,
            Boolean hasLowerBounds,
            BigDecimal upperMediumThreshold,
            BigDecimal upperMaxThreshold,
            BigDecimal lowerMediumThreshold,
            BigDecimal lowerMaxThreshold
    ) {
        boolean hasUpper = Boolean.TRUE.equals(hasUpperBounds);
        boolean hasLower = Boolean.TRUE.equals(hasLowerBounds);

        if (hasUpper
                && upperMediumThreshold.compareTo(upperMaxThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "upperMidThreshold must be less than upperMaxThreshold");
        }
        if (hasLower
                && lowerMediumThreshold.compareTo(lowerMaxThreshold) <= 0) {
            throw new IllegalArgumentException(
                    "lowerMidThreshold must be greater than lowerMinThreshold");
        }
        if (hasUpper && hasLower
                && lowerMediumThreshold.compareTo(upperMediumThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMidThreshold must be less than upperMidThreshold");
        }
    }
}
