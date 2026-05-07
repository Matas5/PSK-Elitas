package com.riskmonitor.service;

import com.riskmonitor.dto.risk.RiskStruct.RiskCreateReq;
import com.riskmonitor.entity.Risk;
import com.riskmonitor.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class RiskService {

    private final RiskRepository riskRepository;

    @Transactional
    public Risk createRisk(RiskCreateReq req) {
        validateSelectedBounds(req);

        BigDecimal lowerMax = req.hasLowerBounds() ? req.lowerMaxThreshold() : null;
        BigDecimal lowerMedium = req.hasLowerBounds() ? req.lowerMediumThreshold() : null;
        BigDecimal upperMedium = req.hasUpperBounds() ? req.upperMediumThreshold() : null;
        BigDecimal upperMax = req.hasUpperBounds() ? req.upperMaxThreshold() : null;

        Risk risk = new Risk(
                req.name().trim(),
                req.description(),
                req.intervalSeconds(),
                req.unit().trim(),
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
}