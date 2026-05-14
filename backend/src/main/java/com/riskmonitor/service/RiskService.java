package com.riskmonitor.service;

import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final RiskRepository riskRepository;

    // for testing, use dto to avoid sending unnecessary fields
    @Transactional(readOnly = true)
    public Risk getRisk(UUID id) {
        return riskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Risk not found: " + id));
    }

    @Transactional
    public Risk createRisk(RiskCreateReq req) {
        validateSelectedBounds(req);
        validateThresholdOrdering(req);

        BigDecimal lowerMax = req.hasLowerBounds() ? req.lowerMaxThreshold() : null;
        BigDecimal lowerMedium = req.hasLowerBounds() ? req.lowerMediumThreshold() : null;
        BigDecimal upperMedium = req.hasUpperBounds() ? req.upperMediumThreshold() : null;
        BigDecimal upperMax = req.hasUpperBounds() ? req.upperMaxThreshold() : null;

        Risk risk = new Risk(
                req.name().trim(),
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

    private void validateSelectedBounds(RiskCreateReq req) {
        if (!req.hasUpperBounds() && !req.hasLowerBounds()) {
            throw new IllegalArgumentException(
                    "At least one of hasUpperBounds or hasLowerBounds must be true");
        }
        if (req.hasUpperBounds()
                && (req.upperMediumThreshold() == null || req.upperMaxThreshold() == null)) {
            throw new IllegalArgumentException(
                    "hasUpperBounds is true but upper threshold values are missing");
        }
        if (req.hasLowerBounds()
                && (req.lowerMediumThreshold() == null || req.lowerMaxThreshold() == null)) {
            throw new IllegalArgumentException(
                    "hasLowerBounds is true but lower threshold values are missing");
        }
    }

    private void validateThresholdOrdering(RiskCreateReq req) {
        if (req.hasUpperBounds()
                && req.upperMediumThreshold().compareTo(req.upperMaxThreshold()) >= 0) {
            throw new IllegalArgumentException(
                    "upperMediumThreshold must be less than upperMaxThreshold");
        }
        if (req.hasLowerBounds()
                && req.lowerMediumThreshold().compareTo(req.lowerMaxThreshold()) <= 0) {
            throw new IllegalArgumentException(
                    "lowerMediumThreshold must be greater than lowerMaxThreshold");
        }
        if (req.hasUpperBounds() && req.hasLowerBounds()
                && req.lowerMediumThreshold().compareTo(req.upperMediumThreshold()) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMediumThreshold must be less than upperMediumThreshold");
        }
    }
}