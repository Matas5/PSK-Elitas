package com.riskmonitor.service;

import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.dto.risk.RiskStruct.RiskUpdateReq;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
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

    @Transactional(readOnly = true)
    public List<Risk> listRisks() {
        return riskRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    @Transactional
    public Risk createRisk(RiskCreateReq req) {
        validateSelectedBounds(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMediumThreshold(),
                req.upperMaxThreshold(),
                req.lowerMediumThreshold(),
                req.lowerMaxThreshold()
        );
        validateThresholdOrdering(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMediumThreshold(),
                req.upperMaxThreshold(),
                req.lowerMediumThreshold(),
                req.lowerMaxThreshold()
        );

        BigDecimal lowerMax = req.hasLowerBounds() ? req.lowerMaxThreshold() : null;
        BigDecimal lowerMedium = req.hasLowerBounds() ? req.lowerMediumThreshold() : null;
        BigDecimal upperMedium = req.hasUpperBounds() ? req.upperMediumThreshold() : null;
        BigDecimal upperMax = req.hasUpperBounds() ? req.upperMaxThreshold() : null;

        Risk risk = new Risk(
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
    public Risk updateRisk(UUID id, RiskUpdateReq req) {
        validateSelectedBounds(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMediumThreshold(),
                req.upperMaxThreshold(),
                req.lowerMediumThreshold(),
                req.lowerMaxThreshold()
        );
        validateThresholdOrdering(
                req.hasUpperBounds(),
                req.hasLowerBounds(),
                req.upperMediumThreshold(),
                req.upperMaxThreshold(),
                req.lowerMediumThreshold(),
                req.lowerMaxThreshold()
        );

        BigDecimal lowerMax = req.hasLowerBounds() ? req.lowerMaxThreshold() : null;
        BigDecimal lowerMedium = req.hasLowerBounds() ? req.lowerMediumThreshold() : null;
        BigDecimal upperMedium = req.hasUpperBounds() ? req.upperMediumThreshold() : null;
        BigDecimal upperMax = req.hasUpperBounds() ? req.upperMaxThreshold() : null;

        Risk risk = getRisk(id);
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
    public void deleteRisk(UUID id) {
        Risk risk = getRisk(id);
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
                    "upperMediumThreshold must be less than upperMaxThreshold");
        }
        if (hasLower
                && lowerMediumThreshold.compareTo(lowerMaxThreshold) <= 0) {
            throw new IllegalArgumentException(
                    "lowerMediumThreshold must be greater than lowerMaxThreshold");
        }
        if (hasUpper && hasLower
                && lowerMediumThreshold.compareTo(upperMediumThreshold) >= 0) {
            throw new IllegalArgumentException(
                    "lowerMediumThreshold must be less than upperMediumThreshold");
        }
    }
}
